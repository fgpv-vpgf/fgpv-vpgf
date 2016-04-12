'use strict';

// TODO consider splitting this module into different modules.  in particular,
//      file-based stuff vs server based stuff, and layer creation vs layer support

// TODO convert internal function header comments to JSDoc, and use the @private tag

const csv2geojson = require('csv2geojson');
const Terraformer = require('terraformer');
const shp = require('shpjs');
const ogc = require('./ogc/ogc.js');
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
* Different types of services that a URL could point to
* @property serviceType {Object}
*/
const serviceType = {
    CSV: 'csv',
    GeoJSON: 'geojson',
    Shapefile: 'shapefile',
    FeatureLayer: 'featurelayer',
    RasterLayer: 'rasterlayer',
    GroupLayer: 'grouplayer',
    TileService: 'tileservice',
    DynamicService: 'dynamicservice',
    ImageService: 'imageservice',
    WMS: 'wms',
    Unknown: 'unknown',
    Error: 'error'
};

// attempts to determine if a path points to a location on the internet,
// or is a local file.  Returns true if internetish
function isServerFile(url) {
    // TODO possibly enhance to be better check, or support more cases

    const lowUrl = url.toLowerCase();
    const tests = [/^http:/, /^https:/, /^ftp:/, /^\/\//];
    return tests.some(test => lowUrl.match(test));

}

// will grab a file from a server address as binary.
// returns a promise that resolves with the file data.
function getServerFile(url, esriBundle) {
    return new Promise((resolve, reject) => {
        // extract info for this service
        const defService = esriBundle.esriRequest({
            url: url,
            handleAs: 'arraybuffer'
        });

        defService.then(srvResult => {
            resolve(srvResult);
        }, error => {
            // something went wrong
            reject(error);
        });
    });
}

// returns a standard information object with serviceType
// supports predictLayerUrl
// type is serviceType enum value
function makeInfo(type) {
    return {
        serviceType: type
    };
}

// returns a standard information object with serviceType and name
// common for most ESRI endpoints
// supports predictLayerUrl
// type is serviceType enum value
// name is property in json containing a service name
// json is json result from service
function makeLayerInfo(type, name, json) {
    const info = makeInfo(type);
    info.name = json[name] || '';
    return info;
}

// returns promise of standard information object with serviceType
// and fileData if file is located online (not on disk).
function makeFileInfo(type, url, esriBundle) {
    return new Promise(resolve => {
        const info = makeInfo(type);
        if (url && isServerFile(url)) {
            // be a pal and download the file content
            getServerFile(url, esriBundle).then(data => {
                info.fileData = data;
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

// inspects the JSON that was returned from a service.
// if the JSON belongs to an ESRI endpoint, we do some terrible dog-logic to attempt
// to derive what type of endpoint it is (mainly by looking for properties that are
// unique to that type of service).
// returns an enumeration value (string) from serviceType based on the match found.
// non-esri services or unexpected esri services will return the .Unknown value
function crawlEsriService(srvJson) {
    if (srvJson.type) {
        // a layer endpoint (i.e. url ends with integer index)
        const mapper = {
            'Feature Layer': serviceType.FeatureLayer,
            'Raster Layer': serviceType.RasterLayer,
            'Group Layer': serviceType.GroupLayer
        };
        return mapper[srvJson.type] || serviceType.Unknown;

    } else if (srvJson.hasOwnProperty('singleFusedMapCache')) {
        if (srvJson.singleFusedMapCache) {
            // a tile server
            return serviceType.TileService;

        } else {
            // a map server
            return serviceType.DynamicService;
        }

    } else if (srvJson.hasOwnProperty('allowGeometryUpdates')) {
        // a feature server
        return serviceType.DynamicService;

    } else if (srvJson.hasOwnProperty('allowedMosaicMethods')) {
        // an image server
        return serviceType.ImageService;

    } else {
        return serviceType.Unknown;
    }
}

// given a URL, attempt to read it as an ESRI rest endpoint.
// returns a promise that resovles with an information object.
// at minimum, the object will have a .serviceType property with a value from the above enumeration.
// if the type is .Unknown, then we were unable to determine the url was an ESRI rest endpoint.
// otherwise, we were successful, and the information object will have other properties depending on the service type
// - .name : scraped from service, but may be rubbish (depends on service publisher). used as UI suggestion only
// - .fields : for feature layer service only. list of fields to allow user to pick name field
// - .geometryTpe : for feature layer service only.  for help in defining the renderer, if required.
function pokeEsriService(url, esriBundle, hint) {

    // reaction functions to different esri services
    const srvHandler = {};

    // feature layer gets some extra treats
    srvHandler[serviceType.FeatureLayer] = srvJson => {
        const info = makeLayerInfo(serviceType.FeatureLayer, 'name', srvJson);
        info.fields = srvJson.fields;
        info.geometryType = srvJson.geometryType;
        return info;
    };

    // no treats for raster (for now)
    srvHandler[serviceType.RasterLayer] = srvJson => {
        return makeLayerInfo(serviceType.RasterLayer, 'name', srvJson);
    };

    // no treats for group (for now)
    srvHandler[serviceType.GroupLayer] = srvJson => {
        return makeLayerInfo(serviceType.GroupLayer, 'name', srvJson);
    };

    // no treats for tile (for now)
    srvHandler[serviceType.TileService] = srvJson => {
        return makeLayerInfo(serviceType.TileService, 'mapName', srvJson);
    };

    // no treats for mapserver / dynamic (for now)
    srvHandler[serviceType.DynamicService] = srvJson => {
        return makeLayerInfo(serviceType.DynamicService, 'mapName', srvJson);
    };

    // no treats for imageserver (for now)
    srvHandler[serviceType.ImageService] = srvJson => {
        const info = makeLayerInfo(serviceType.ImageService, 'name', srvJson);
        info.fields = srvJson.fields;
        return info;
    };

    // couldnt figure it out
    srvHandler[serviceType.Unknown] = () => {
        return makeInfo(serviceType.Unknown);
    };

    return new Promise(resolve => {
        // extract info for this service
        const defService = esriBundle.esriRequest({
            url: url,
            content: { f: 'json' },
            callbackParamName: 'callback',
            handleAs: 'json',
        });

        defService.then(srvResult => {
            // request didnt fail, indicating it is likely an ArcGIS Server endpoint

            if (hint) {
                // force the data extraction of the hinted format
                resolve(srvHandler[hint](srvResult));
            } else {
                // inspect the result, and do bad logic to try to determine the service type
                resolve(srvHandler[crawlEsriService(srvResult)](srvResult));
            }
        }, () => {
            // something went wrong, but that doesnt mean our service is invalid yet
            // it's likely not ESRI.  return unknown and let main predictor keep investigating
            resolve(makeInfo(serviceType.Unknown));
        });
    });
}

// tests a URL to see if the value is a file
// providing the known type as a hint will cause the function to run the
// specific logic for that file type, rather than guessing and trying everything
// resolves with promise of information object
// - serviceType : the type of file (CSV, Shape, GeoJSON, Unknown)
// - fileData : if the file is located on a server, will xhr
function pokeFile(url, esriBundle, hint) {

    // reaction functions to different files
    // overkill right now, as files just identify the type right now
    // but structure will let us enhance for custom things if we need to
    const fileHandler = {};

    // csv
    fileHandler[serviceType.CSV] = () => {
        return makeFileInfo(serviceType.CSV, url, esriBundle);
    };

    // geojson
    fileHandler[serviceType.GeoJSON] = () => {
        return makeFileInfo(serviceType.GeoJSON, url, esriBundle);
    };

    // csv
    fileHandler[serviceType.Shapefile] = () => {
        return makeFileInfo(serviceType.Shapefile, url, esriBundle);
    };

    // couldnt figure it out
    fileHandler[serviceType.Unknown] = () => {
        // dont supply url, as we don't want to download random files
        return makeFileInfo(serviceType.Unknown);
    };

    return new Promise(resolve => {
        if (hint) {
            // force the data extraction of the hinted format
            resolve(fileHandler[hint]());
        } else {
            // inspect the url for file extensions
            let guessType = serviceType.Unknown;
            switch (url.substr(url.lastIndexOf('.') + 1).toLowerCase()) {

                // check for file extensions
                case 'csv':
                    guessType = serviceType.CSV;
                    break;
                case 'zip':
                    guessType = serviceType.Shapefile;
                    break;

                case 'json':
                    guessType = serviceType.GeoJSON;
                    break;
            }
            resolve(fileHandler[guessType]());
        }
    });
}

// tests a URL to see if the value is a wms
// resolves with promise of information object
// - serviceType : the type of service (WMS, Unknown)
function pokeWms(url, esriBundle) {

    // FIXME add some WMS detection logic.  that would be nice

    console.log(url, esriBundle); // to stop jslint from quacking. remove when params are actually used

    return Promise.resolve(makeInfo(serviceType.WMS));
}

function predictLayerUrlBuilder(esriBundle) {
    /**
    * Attempts to determine what kind of layer the URL most likely is, and
    * if possible, return back some useful information about the layer
    *
    * - serviceType: the type of layer the function thinks the url is referring to. is a value of serviceType enumeration (string)
    * - fileData: file contents in an array buffer. only present if the URL points to a file that exists on an internet server (i.e. not a local disk drive)
    * - name: best attempt at guessing the name of the service (string). only present for ESRI service URLs
    * - fields: array of field definitions for the layer. conforms to ESRI's REST field standard. only present for feature layer and image service URLs.
    * - geometryType: describes the geometry of the layer (string). conforms to ESRI's REST geometry type enum values. only present for feature layer URLs.
    *
    * @method predictLayerUrl
    * @param {String} url a url to something that is hopefully a map service
    * @param {String} hint optional. allows the caller to specify the url type, forcing the function to run the data logic for that type
    * @returns {Promise} a promise resolving with an infomation object
    */
    return (url, hint) => {

        // TODO this function has lots of room to improve.  there are many valid urls that it will
        //      fail to identify correctly in it's current state

        // TODO refactor how this function works.
        //      wait for the web service request library to not be esri/request
        //      use new library to make a head call on the url provided
        //      examine the content type of the head call result
        //        if xml, assume WMS
        //        if json, assume esri  (may need extra logic to differentiate from json file?)
        //        file case is explicit (e.g text/json)
        //      then hit appropriate handler, do a second web request for content if required

        if (hint) {
            // go directly to appropriate logic block
            const hintToFlavour = {}; // why? cuz cyclomatic complexity + OBEY RULES
            const flavourToHandler = {};

            // hint type to hint flavour
            hintToFlavour[serviceType.CSV] = 'F_FILE';
            hintToFlavour[serviceType.GeoJSON] = 'F_FILE';
            hintToFlavour[serviceType.Shapefile] = 'F_FILE';
            hintToFlavour[serviceType.FeatureLayer] = 'F_ESRI';
            hintToFlavour[serviceType.RasterLayer] = 'F_ESRI';
            hintToFlavour[serviceType.GroupLayer] = 'F_ESRI';
            hintToFlavour[serviceType.TileService] = 'F_ESRI';
            hintToFlavour[serviceType.DynamicService] = 'F_ESRI';
            hintToFlavour[serviceType.ImageService] = 'F_ESRI';
            hintToFlavour[serviceType.WMS] = 'F_WMS';

            // hint flavour to flavour-handler
            flavourToHandler.F_FILE = () => {
                return pokeFile(url, esriBundle, hint);
            };

            flavourToHandler.F_ESRI = () => {
                return pokeEsriService(url, esriBundle, hint);
            };

            flavourToHandler.F_WMS = () => {
                // FIXME REAL LOGIC COMING SOON
                return pokeWms(url, esriBundle);
            };

            // execute handler.  hint -> flavour -> handler -> run it -> promise
            return flavourToHandler[hintToFlavour[hint]]();

        } else {

            // TODO restructure.  this approach cleans up the pyramid of doom.
            //      Needs to add check for empty tests, resolve as unknown.
            //      Still a potential to take advantage of the nice structure.  Will depend
            //      what comes first:  WMS logic (adding a 3rd test), or changing the request
            //      library, meaning we get the type early from the head request.
            /*
            tests = [pokeFile, pokeService];

            function runTests() {
                test = tests.pop();
                test(url, esriBundle).then(info => {
                    if (info.serviceType !== serviceType.Unknown) {
                        resolve(info);
                        return;
                    }
                    runTests();
                });
            }

            runTests();
            */

            return new Promise(resolve => {
                // no hint. run tests until we find a match.
                // test for file
                pokeFile(url, esriBundle).then(infoFile => {
                    if (infoFile.serviceType === serviceType.Unknown) {
                        // not a file, test for ESRI
                        pokeEsriService(url, esriBundle).then(infoEsri => {
                            if (infoEsri.serviceType === serviceType.Unknown) {
                                // FIXME REAL LOGIC COMING SOON
                                // pokeWMS
                                resolve(null);
                            } else {
                                // it was a esri service. rejoice.
                                resolve(infoEsri);
                            }
                        });
                    } else {
                        // it was a file. rejoice.
                        resolve(infoFile);
                    }
                });
            });
        }
    };
}

/**
* Converts an array buffer to a string
*
* @method arrayBufferToString
* @private
* @param {Arraybuffer} buffer an array buffer containing stuff (ideally string-friendly)
* @returns {String} array buffer in string form
*/
function arrayBufferToString(buffer) {
    // handles UTF8 encoding
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

/**
* Performs validation on GeoJson object. Returns validation object.
* Worker function for validateFile, see that file for return value specs
*
* @method validateGeoJson
* @private
* @param {Object} geoJson feature collection in geojson form
* @returns {Object} information on the geoJson object
*/
function validateGeoJson(geoJson) {
    // GeoJSON geometry type to ESRI geometry type
    const geomMap = {
        Point: 'esriGeometryPoint',
        MultiPoint: 'esriGeometryMultipoint',
        LineString: 'esriGeometryPolyline',
        MultiLineString: 'esriGeometryPolyline',
        Polygon: 'esriGeometryPolygon',
        MultiPolygon: 'esriGeometryPolygon'
    };
    const res = {};

    res.fields = extractFields(geoJson);
    res.geometryType = geomMap[geoJson.features[0].geometry.type];
    if (!res.geometryType) {
        throw new Error('Unexpected geometry type in GeoJSON');
    }
    res.formattedData = geoJson;

    // TODO optional check: iterate through every feature, ensure geometry type and properties are all identical

    return res;
}

/**
* Validates file content.  Does some basic checking for errors. Attempts to get field list, and
* if possible, provide the file in a more useful format. Promise rejection indicates failed validation
*
* - formattedData: file contents in a more useful format. JSON for GeoJSON and Shapefile. String for CSV
* - fields: array of field definitions for the file. conforms to ESRI's REST field standard.
* - geometryType: describes the geometry of the file (string). conforms to ESRI's REST geometry type enum values.
*
* @method validateFile
* @param {String} type the format of file. aligns to serviceType enum (CSV, Shapefile, GeoJSON)
* @param {Arraybuffer} data the file content in binary
* @returns {Promise} a promise resolving with an infomation object
*/
function validateFile(type, data) {

    const fileHandler = {}; // maps handlers for different file types

    fileHandler[serviceType.CSV] = data => {
        return new Promise((resolve, reject) => {

            // convert from arraybuffer to string to parsed csv. store string format for later
            const res = {
                formattedData: arrayBufferToString(data)
            };

            const fileArr = csvPeek(res.formattedData, ',');

            // validations
            if (fileArr.length === 0) {
                // fail, no rows
                reject(new Error('File has no rows'));
            } else {
                // field count of first row.
                const fc = fileArr[0].length;
                if (fc < 2) {
                    // fail not enough columns
                    reject(new Error('File has less than two columns'));
                } else {
                    // check field counts of each row
                    if (fileArr.every(rowArr => rowArr.length === fc)) {
                        // make field list esri-ish for consistancy
                        res.fields = fileArr[0].map(field => ({
                            name: field,
                            type: 'esriFieldTypeString'
                        }));
                        res.geometryType = 'esriGeometryPoint'; // always point for CSV
                        resolve(res);
                    } else {
                        reject(new Error('File has no rows'));
                    }
                }
            }
        });
    };

    fileHandler[serviceType.GeoJSON] = data => {
        return new Promise(resolve => {
            // convert from arraybuffer to string to json
            const geoJson = JSON.parse(arrayBufferToString(data));
            resolve(validateGeoJson(geoJson));
        });
    };

    fileHandler[serviceType.Shapefile] = data => {
        return new Promise((resolve, reject) => {
            // convert from arraybuffer (containing zipped shapefile) to json (using shp library)
            shp(data).then(geoJson => {
                resolve(validateGeoJson(geoJson));
            }).catch(err => {
                reject(err);
            });
        });
    };

    // trigger off the appropriate handler, return promise
    return fileHandler[type](data);
}

function serverLayerIdentifyBuilder(esriBundle) {
    // TODO we are using layerIds option property as it aligns with what the ESRI identify parameter
    //      object uses.  However, in r2 terminology, a layerId is specific to a full map layer, not
    //      indexes of a single dynamic layer.  for clarity, could consider renaming to .visibleLayers
    //      and then map the value to the .layerIds property inside this function.

    /**
    * Perform a server-side identify on a layer (usually an ESRI dynamic layer)
    * Accepts the following options:
    *   - geometry: Required. geometry in map co-ordinates for the area to identify.
    *     will usually be an ESRI Point, though a polygon would work.
    *   - mapExtent: Required. ESRI Extent of the current map view
    *   - width: Required. Width of the map in pixels
    *   - height: Required. Height of the map in pixels
    *   - layerIds: an array of integers specifying the layer indexes to be examined. Will override the current
    *     visible indexes in the layer parameter
    *   - returnGeometry: a boolean indicating if result geometery should be returned with results.  Defaults to false
    *   - tolerance: an integer indicating how many screen pixels away from the mouse is valid for a hit.  Defaults to 5
    *
    * @method serverLayerIdentify
    * @param {Object} layer an ESRI dynamic layer object
    * @param {Object} opts An object for supplying additional parameters
    * @returns {Promise} a promise resolving with an array of identify results (empty array if no hits)
    */
    return (layer, opts) => {

        const identParams = new esriBundle.IdentifyParameters();

        // pluck treats from options parameter
        if (opts) {

            const reqOpts = ['geometry', 'mapExtent', 'height', 'width'];
            reqOpts.forEach(optProp => {
                if (opts[optProp]) {
                    identParams[optProp] = opts[optProp];
                } else {
                    throw new Error(`serverLayerIdentify - missing opts.${ optProp } arguement`);
                }
            });

            identParams.layerIds = opts.layerIds || layer.visibleLayers;
            identParams.returnGeometry = opts.returnGeometry || false;
            identParams.layerOption = esriBundle.IdentifyParameters.LAYER_OPTION_ALL;
            identParams.spatialReference = opts.geometry.spatialReference;
            identParams.tolerance = opts.tolerance || 5;

            // TODO add support for identParams.layerDefinitions once attribute filtering is implemented

        } else {
            throw new Error('serverLayerIdentify - missing opts arguement');
        }

        // asynch an identify task
        return new Promise((resolve, reject) => {
            const identify = new esriBundle.IdentifyTask(layer.url);

            // TODO possibly tack on the layer.id to the resolved thing so we know which parent layer returned?
            //      would only be required if the caller is mashing promises together and using Promise.all()

            identify.on('complete', result => {
                resolve(result.results);
            });
            identify.on('error', err => {
                reject(err.error);
            });

            identify.execute(identParams);
        });
    };
}

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
        // do math!
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

    // for every feature, if it does not have an id property, add it.
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
    // look up projection definitions if it's not already loaded and we have enough info
    if (!projModule.getProjection(projCode) && epsgLookup && projCode) {
        return epsgLookup(projCode).then(projDef => {
            if (projDef) {
                // register projection
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

        // TODO add documentation on why we only support layers with WKID (and not WKT).
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

        // ensure our features have ids
        assignIds(geoJson);
        layerDefinition.drawingInfo =
            defaultRenderers[featureTypeToRenderer[geoJson.features[0].geometry.type]];

        // attempt to get spatial reference from geoJson
        if (geoJson.crs && geoJson.crs.type === 'name') {
            srcProj = geoJson.crs.properties.name;
        }

        // pluck treats from options parameter
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

            // TODO add support for renderer option, or drop the option

        } else {
            throw new Error('makeGeoJsonLayer - missing opts arguement');
        }

        if (layerDefinition.fields.length === 1) {
            // caller has not supplied custom field list. so take them all.
            layerDefinition.fields = layerDefinition.fields.concat(extractFields(geoJson));
        }

        const destProj = 'EPSG:' + targetWkid;

        // look up projection definitions if they don't already exist and we have enough info
        const srcLookup = projectionLookup(geoApi.proj, srcProj, opts.epsgLookup);
        const destLookup = projectionLookup(geoApi.proj, destProj, opts.epsgLookup);

        // make the layer
        const buildLayer = new Promise(resolve => {
            // project data and convert to esri json format
            // console.log('reprojecting ' + srcProj + ' -> EPSG:' + targetWkid);
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

            // TODO : revisit if we actually need this anymore
            // layer.renderer._RampRendererType = featureTypeToRenderer[geoJson.features[0].geometry.type];

            resolve(layer);
        });

        // call promises in order
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
        const csvOpts = { // default values
            latfield: 'Lat',
            lonfield: 'Long',
            delimiter: ','
        };

        // user options if
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

                    // TODO are we at risk adding params to the var that was passed in? should we make a copy and modify the copy?
                    opts.sourceProjection = 'EPSG:4326'; // csv is always latlong
                    opts.renderer = 'circlePoint'; // csv is always latlong

                    // NOTE: since makeGeoJsonLayer is a "built" function, grab the built version from our link to api object
                    geoApi.layer.makeGeoJsonLayer(data, opts).then(jsonLayer => {
                        resolve(jsonLayer);
                    });
                }

            });
        });

    };
}

/**
* Peek at the CSV output (useful for checking headers)
* @param {string} csvData the CSV data to be processed
* @param {string} delimiter the delimiter used by the data
* @returns {Array} an array of arrays containing the parsed CSV
*/
function csvPeek(csvData, delimiter) {
    return csv2geojson.dsv(delimiter).parseRows(csvData);
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
            // turn shape into geojson
            shp(shapeData).then(geoJson => {
                // turn geojson into feature layer
                // NOTE: since makeGeoJsonLayer is a "built" function, grab the built version from our link to api object
                geoApi.layer.makeGeoJsonLayer(geoJson, opts).then(jsonLayer => {
                    resolve(jsonLayer);
                });
            }).catch(err => {
                reject(err);
            });
        });
    };
}

function getFeatureInfoBuilder(esriBundle) {
    /**
    * Fetches feature information, including geometry, from esri servers for feature layer.
    * @param {layerUrl} layerUrl linking to layer where feature layer resides
    * @param {objectId} objectId for feature to be retrived from a feature layer
    * @returns {Promise} promise resolves with an esri Graphic (http://resources.arcgis.com/en/help/arcgis-rest-api/#/Feature_Map_Service_Layer/02r3000000r9000000/)
    */
    return (layerUrl, objectId) => {
        return new Promise(
            (resolve, reject) => {
                const defData = esriBundle.esriRequest({
                    url: layerUrl + objectId,
                    content: {
                        f: 'json',
                    },
                    callbackParamName: 'callback',
                    handleAs: 'json'
                });

                defData.then(
                    layerObj => {
                        console.log(layerObj);
                        resolve(layerObj);
                    }, error => {
                        console.warn(error);
                        reject(error);
                    }
                );
            });
    };
}

// CAREFUL NOW!
// we are passing in a reference to geoApi.  it is a pointer to the object that contains this module,
// along with other modules. it lets us access other modules without re-instantiating them in here.
module.exports = function (esriBundle, geoApi) {

    return {
        ArcGISDynamicMapServiceLayer: esriBundle.ArcGISDynamicMapServiceLayer,
        ArcGISImageServiceLayer: esriBundle.ArcGISImageServiceLayer,
        GraphicsLayer: esriBundle.GraphicsLayer,
        FeatureLayer: esriBundle.FeatureLayer,
        Query: esriBundle.Query,
        TileLayer: esriBundle.ArcGISTiledMapServiceLayer,
        ogc: ogc(esriBundle),
        LayerDrawingOptions: esriBundle.LayerDrawingOptions,
        getFeatureInfo: getFeatureInfoBuilder(esriBundle),
        makeGeoJsonLayer: makeGeoJsonLayerBuilder(esriBundle, geoApi),
        makeCsvLayer: makeCsvLayerBuilder(esriBundle, geoApi),
        makeShapeLayer: makeShapeLayerBuilder(esriBundle, geoApi),
        serverLayerIdentify: serverLayerIdentifyBuilder(esriBundle),
        predictLayerUrl: predictLayerUrlBuilder(esriBundle),
        validateFile,
        csvPeek,
        serviceType
    };
};
