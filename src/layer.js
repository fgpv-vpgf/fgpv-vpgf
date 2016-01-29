'use strict';
const csv2geojson = require('csv2geojson');
const Terraformer = require('terraformer');
const shp = require('shpjs');
const defaultRenderers = require('./defaultRenderers.json');
Terraformer.ArcGIS = require('terraformer-arcgis-parser');

/**
* Maps GeoJSON geometry types to a set of default renders defined in GlobalStorage.DefaultRenders
* @property featureTypeToRenderer {Object}
* @private
*/
const featureTypeToRenderer = {
    Point: 'circlePoint',
    MultiPoint: 'circlePoint',
    LineString: 'solidLine',
    MultiLineString: 'solidLine',
    Polygon: 'outlinedPoly',
    MultiPolygon: 'outlinedPoly'
};

/**
* Get a 'good enough' uuid. For backup purposes if client does not supply its own
* unique layer id
*
* @method  generateUUID
* @returns {String} a uuid
*/
function generateUUID() {
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        //do math!
        /*jslint bitwise: true */
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        /*jslint bitwise: false */
    });
}

/**
* Performs in place assignment of integer ids for a GeoJSON FeatureCollection.
* Assumes all features have ids or all do not.  May fail (create duplicate keys) if some do and some don't
*/
function assignIds(geoJson) {
    if (geoJson.type !== 'FeatureCollection') {
        throw new Error('Assignment can only be performed on FeatureCollections');
    }

    //for every feature, if it does not have an id property, add it.
    geoJson.features.forEach(function (val, idx) {
        if (typeof val.id === 'undefined') {
            val.id = idx;
        }
    });
}

/**
 * Extracts fields from the first feature in the feature collection, does no
 * guesswork on property types and calls everything a string.
 */
function extractFields(geoJson) {
    if (geoJson.features.length < 1) {
        throw new Error('Field extraction requires at least one feature');
    }

    return Object.keys(geoJson.features[0].properties).map(function (prop) {
        return { name: prop, type: 'esriFieldTypeString' };
    });
}

/**
 * Makes an attempt to load and register a projection definition.
 * Returns promise resolving when process is complete
 * projModule - proj module from geoApi
 * projCode - the string or int epsg code we want to lookup
 * epsgLookup - function that will do the epsg lookup, taking code and returning promise of result or null
 */
function projectionLookup(projModule, projCode, epsgLookup) {
    //look up projection definitions if it's not already loaded and we have enough info
    if (!projModule.getProjection(projCode) && epsgLookup && projCode) {
        return epsgLookup(projCode).then(projDef => {
            if (projDef) {
                //register projection
                projModule.addProjection(projCode, projDef);
            }
            return projDef;
        });
    } else {
        return Promise.resolve(null);
    }
}

function makeGeoJsonLayerBuilder(esriBundle, geoApi) {

    /**
    * Converts a GeoJSON object into a FeatureLayer.  Expects GeoJSON to be formed as a FeatureCollection
    * containing a uniform feature type (FeatureLayer type will be set according to the type of the first
    * feature entry).  Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid, defaults to map wkid if not specified
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - sourceProjection: a string matching a proj4.defs projection to be used for the source data (overrides
    *     geoJson.crs)
    *   - fields: an array of fields to be appended to the FeatureLayer layerDefinition (OBJECTID is set by default)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    *   - layerId: a string to use as the layerId
    *
    * @method makeGeoJsonLayer
    * @param {Object} geoJson An object following the GeoJSON specification, should be a FeatureCollection with
    * Features of only one type
    * @param {Object} opts An object for supplying additional parameters
    * @returns {Promise} a promise resolving with a {FeatureLayer}
    */
    return (geoJson, opts) => {

        //TODO add documentation on why we only support layers with WKID (and not WKT).
        let targetWkid;
        let srcProj;
        let layerId;
        const layerDefinition = {
            objectIdField: 'OBJECTID',
            fields: [
                {
                    name: 'OBJECTID',
                    type: 'esriFieldTypeOID',
                },
            ],
        };

        //ensure our features have ids
        assignIds(geoJson);
        layerDefinition.drawingInfo =
            defaultRenderers[featureTypeToRenderer[geoJson.features[0].geometry.type]];

        //attempt to get spatial reference from geoJson
        if (geoJson.crs && geoJson.crs.type === 'name') {
            srcProj = geoJson.crs.properties.name;
        }

        //pluck treats from options parameter
        if (opts) {
            if (opts.sourceProjection) {
                srcProj = opts.sourceProjection;
            }

            if (opts.targetWkid) {
                targetWkid = opts.targetWkid;
            } else {
                throw new Error('makeGeoJsonLayer - missing opts.targetWkid arguement');
            }

            if (opts.fields) {
                layerDefinition.fields = layerDefinition.fields.concat(opts.fields);
            }

            if (opts.layerId) {
                layerId = opts.layerId;
            } else {
                layerId = generateUUID();
            }

            //TODO add support for renderer option, or drop the option

        } else {
            throw new Error('makeGeoJsonLayer - missing opts arguement');
        }

        if (layerDefinition.fields.length === 1) {
            //caller has not supplied custom field list. so take them all.
            layerDefinition.fields = layerDefinition.fields.concat(extractFields(geoJson));
        }

        const destProj = 'EPSG:' + targetWkid;

        //look up projection definitions if they don't already exist and we have enough info
        const srcLookup = projectionLookup(geoApi.proj, srcProj, opts.epsgLookup);
        const destLookup = projectionLookup(geoApi.proj, destProj, opts.epsgLookup);

        //make the layer
        const buildLayer = new Promise(resolve => {
            //project data and convert to esri json format
            //console.log('reprojecting ' + srcProj + ' -> EPSG:' + targetWkid);
            geoApi.proj.projectGeojson(geoJson, destProj, srcProj);
            const esriJson = Terraformer.ArcGIS.convert(geoJson, { sr: targetWkid });

            const fs = {
                features: esriJson,
                geometryType: layerDefinition.drawingInfo.geometryType
            };

            const layer = new esriBundle.FeatureLayer(
                {
                    layerDefinition: layerDefinition,
                    featureSet: fs
                }, {
                    mode: esriBundle.FeatureLayer.MODE_SNAPSHOT,
                    id: layerId
                });

            // ＼(｀O´)／ manually setting SR because it will come out as 4326
            layer.spatialReference = new esriBundle.SpatialReference({ wkid: targetWkid });

            //TODO : revisit if we actually need this anymore
            //layer.renderer._RampRendererType = featureTypeToRenderer[geoJson.features[0].geometry.type];

            resolve(layer);
        });

        //call promises in order
        return srcLookup
            .then(() => destLookup)
            .then(() => buildLayer);

    };
}

function makeCsvLayerBuilder(esriBundle, geoApi) {

    /**
    * Constructs a FeatureLayer from CSV data. Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid the spatial reference the returned layer should be in
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - fields: an array of fields to be appended to the FeatureLayer layerDefinition (OBJECTID is set by default)
    *   - latfield: a string identifying the field containing latitude values ('Lat' by default)
    *   - lonfield: a string identifying the field containing longitude values ('Long' by default)
    *   - delimiter: a string defining the delimiter character of the file (',' by default)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    *   - layerId: a string to use as the layerId
    * @param {string} csvData the CSV data to be processed
    * @param {object} opts options to be set for the parser
    * @returns {Promise} a promise resolving with a {FeatureLayer}
    */
    return (csvData, opts) => {
        const csvOpts = { //default values
            latfield: 'Lat',
            lonfield: 'Long',
            delimiter: ','
        };

        //user options if
        if (opts) {
            if (opts.latfield) {
                csvOpts.latfield = opts.latfield;
            }

            if (opts.lonfield) {
                csvOpts.lonfield = opts.lonfield;
            }

            if (opts.delimiter) {
                csvOpts.delimiter = opts.delimiter;
            }
        }

        return new Promise((resolve, reject) => {
            csv2geojson.csv2geojson(csvData, csvOpts, (err, data) => {
                if (err) {
                    console.warn('csv conversion error');
                    console.log(err);
                    reject(err);
                } else {
                    // csv2geojson will not include the lat and long in the feature
                    data.features.map(feature => {
                        // add new property Long and Lat before layer is generated
                        feature.properties[csvOpts.lonfield] = feature.geometry.coordinates[0];
                        feature.properties[csvOpts.latfield] = feature.geometry.coordinates[1];
                    });

                    //TODO are we at risk adding params to the var that was passed in? should we make a copy and modify the copy?
                    opts.sourceProjection = 'EPSG:4326'; //csv is always latlong
                    opts.renderer = 'circlePoint'; //csv is always latlong

                    //NOTE: since makeGeoJsonLayer is a "built" function, grab the built version from our link to api object
                    geoApi.layer.makeGeoJsonLayer(data, opts).then(jsonLayer => {
                        resolve(jsonLayer);
                    });
                }

            });
        });

    };
}

function makeShapeLayerBuilder(esriBundle, geoApi) {

    /**
    * Constructs a FeatureLayer from Shapefile data. Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid the spatial reference the returned layer should be in
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - sourceProjection: a string matching a proj4.defs projection to be used for the source data (overrides
    *     geoJson.crs)
    *   - fields: an array of fields to be appended to the FeatureLayer layerDefinition (OBJECTID is set by default)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    *   - layerId: a string to use as the layerId
    * @param {ArrayBuffer} shapeData an ArrayBuffer of the Shapefile in zip format
    * @param {object} opts options to be set for the parser
    * @returns {Promise} a promise resolving with a {FeatureLayer}
    */
    return (shapeData, opts) => {
        return new Promise((resolve, reject) => {
            //turn shape into geojson
            shp(shapeData).then(geoJson => {
                //turn geojson into feature layer
                //NOTE: since makeGeoJsonLayer is a "built" function, grab the built version from our link to api object
                geoApi.layer.makeGeoJsonLayer(geoJson, opts).then(jsonLayer => {
                    resolve(jsonLayer);
                });
            }).catch(err => {
                reject(err);
            });
        });
    };
}

//CAREFUL NOW!
//we are passing in a reference to geoApi.  it is a pointer to the object that contains this module,
//along with other modules. it lets us access other modules without re-instantiating them in here.
module.exports = function (esriBundle, geoApi) {

    return {
        ArcGISDynamicMapServiceLayer: esriBundle.ArcGISDynamicMapServiceLayer,
        ArcGISImageServiceLayer: esriBundle.ArcGISImageServiceLayer,
        GraphicsLayer: esriBundle.GraphicsLayer,
        FeatureLayer: esriBundle.FeatureLayer,
        WmsLayer: esriBundle.WmsLayer,
        makeGeoJsonLayer: makeGeoJsonLayerBuilder(esriBundle, geoApi),
        makeCsvLayer: makeCsvLayerBuilder(esriBundle, geoApi),
        makeShapeLayer: makeShapeLayerBuilder(esriBundle, geoApi)
    };
};
