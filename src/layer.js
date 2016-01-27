'use strict';
const csv2geojson = require('csv2geojson');
const Terraformer = require('terraformer');
const proj = require('./proj.js');
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

let idCounter = 0;

/**
* Get an auto-generated layer id.  This works because javascript is single threaded: if this gets called
* from a web-worker at some point it will need to be synchronized.
*
* @method  nextId
* @returns {String} an auto-generated layer id
*/
function nextId() {
    idCounter += 1;
    return 'geoApiAutoId_' + idCounter;
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

function makeGeoJsonLayerBuilder(esriBundle) {

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
        const projLib = proj(esriBundle);
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
                //TODO enhance to standard error handling once decided
                console.warn('makeGeoJsonLayer - missing opts.targetWkid arguement');
            }

            if (opts.fields) {
                layerDefinition.fields = layerDefinition.fields.concat(opts.fields);
            }

            //TODO add support for renderer option, or drop the option

        } else {
            //TODO enhance to standard error handling once decided
            console.warn('makeGeoJsonLayer - missing opts arguement');
        }

        if (layerDefinition.fields.length === 1) {
            //caller has not supplied custom field list. so take them all.
            layerDefinition.fields = layerDefinition.fields.concat(extractFields(geoJson));
        }

        //FIXME fix this horrid mess.
        // a) addProjection is misleading when using it to access a definition.
        // b) we need a better spot to load in the pre-cooked ones, especially the esri ones that epsg.io does not supply.
        //    - in proj module constructor, tho this would be adding state to the library
        //    - baked into epsgLookup() in angular, tho this could be confusing for anyone wanting to change to a different function
        projLib.addProjection('EPSG:3978', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 ' +
            '+lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
        projLib.addProjection('EPSG:3979', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 ' +
            '+x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
        projLib.addProjection('EPSG:102100', projLib.addProjection('EPSG:3857'));
        projLib.addProjection('EPSG:54004', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 ' +
            '+datum=WGS84 +units=m +no_defs');

        return new Promise(resolve => {
            const destProj = 'EPSG:' + targetWkid;
            let projSrcProm;
            let projDestProm;

            //look up projection definitions if they don't already exist and we have enough info
            if (!projLib.addProjection(srcProj) && opts.epsgLookup && srcProj) {
                projSrcProm = opts.epsgLookup(srcProj);
            } else {
                //no lookup function provided. return code that cannot find projection string
                projSrcProm = new Promise(resolve => {resolve(null);});
            }

            if (!projLib.addProjection(destProj) && opts.epsgLookup) {
                projDestProm = opts.epsgLookup(destProj);
            } else {
                //no lookup function provided. return code that cannot find projection string
                projDestProm = new Promise(resolve => {resolve(null);});
            }

            //wait for both projection lookups to resolve; if results, add them to proj library definitions.
            //NOTE: not using Promise.all() as there is no way to map the proj definition to the proj code
            projSrcProm.then(projSrcDef => {
                if (srcProj && projSrcDef) {
                    projLib.addProjection(srcProj, projSrcDef);
                }
                return projDestProm; //chain next promise
            }).then(projDestDef => {

                if (destProj && projDestDef) {
                    projLib.addProjection(destProj, projDestDef);
                }

                //project data and convert to esri json format
                //console.log('reprojecting ' + srcProj + ' -> EPSG:' + targetWkid);
                projLib.projectGeojson(geoJson, destProj, srcProj);
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
                        id: nextId()
                    });

                // ＼(｀O´)／ manually setting SR because it will come out as 4326
                layer.spatialReference = new esriBundle.SpatialReference({ wkid: targetWkid });

                //TODO : revisit if we actually need this anymore
                //layer.renderer._RampRendererType = featureTypeToRenderer[geoJson.features[0].geometry.type];

                resolve(layer);
            });
        });
    };
}

function makeCsvLayerBuilder(esriBundle) {

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

                    //TODO is there a better way to call the makeGeoJsonLayer instead of having to run the builder function?
                    makeGeoJsonLayerBuilder(esriBundle)(data, opts).then(jsonLayer => {
                        resolve(jsonLayer);
                    });
                }

            });
        });

    };
}

function makeShapeLayerBuilder(esriBundle) {

    /**
    * Constructs a FeatureLayer from Shapefile data. Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid the spatial reference the returned layer should be in
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - sourceProjection: a string matching a proj4.defs projection to be used for the source data (overrides
    *     geoJson.crs)
    *   - fields: an array of fields to be appended to the FeatureLayer layerDefinition (OBJECTID is set by default)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    * @param {ArrayBuffer} shapeData an ArrayBuffer of the Shapefile in zip format
    * @param {object} opts options to be set for the parser
    * @returns {Promise} a promise resolving with a {FeatureLayer}
    */
    return (shapeData, opts) => {
        return new Promise((resolve, reject) => {
            //turn shape into geojson
            shp(shapeData).then(geoJson => {
                try {
                    //turn geojson into feature layer
                    //TODO is there a better way to call the makeGeoJsonLayer instead of having to run the builder function?
                    makeGeoJsonLayerBuilder(esriBundle)(geoJson, opts).then(jsonLayer => {
                        resolve(jsonLayer);
                    });
                } catch (e) {
                    reject(e);
                }
            }).catch(err => {
                reject(err);
            });
        });
    };
}

// NOTE: we should split this out if this module becomes too big
module.exports = function (esriBundle) {

    return {
        ArcGISDynamicMapServiceLayer: esriBundle.ArcGISDynamicMapServiceLayer,
        ArcGISImageServiceLayer: esriBundle.ArcGISImageServiceLayer,
        GraphicsLayer: esriBundle.GraphicsLayer,
        FeatureLayer: esriBundle.FeatureLayer,
        WmsLayer: esriBundle.WmsLayer,
        makeGeoJsonLayer: makeGeoJsonLayerBuilder(esriBundle),
        makeCsvLayer: makeCsvLayerBuilder(esriBundle),
        makeShapeLayer: makeShapeLayerBuilder(esriBundle)
    };
};
