'use strict';

// TODO consider splitting this module into different modules.  in particular,
//      file-based stuff vs server based stuff, and layer creation vs layer support

// TODO convert internal function header comments to JSDoc, and use the @private tag

const csv2geojson = require('csv2geojson');
const Terraformer = require('terraformer');
const shp = require('shpjs');
const ogc = require('./layer/ogc.js');
const bbox = require('./layer/bbox.js');
const layerRecord = require('./layer/layerRec/main.js');
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
    FeatureService: 'featureservice',
    DynamicService: 'dynamicservice',
    ImageService: 'imageservice',
    WMS: 'wms',
    WFS: 'wfs',
    Unknown: 'unknown',
    Error: 'error'
};

// returns a standard information object with serviceType
// supports predictLayerUrl
// type is serviceType enum value
function makeInfo(type) {
    return {
        serviceType: type,
        index: -1,
        tileSupport: false
    };
}

/**
 * Returns a standard information object with info common for most ESRI endpoints
 * .serviceName
 * .serviceType
 * .tileSupport
 * .rootUrl
 *
 * @function makeLayerInfo
 * @private
 * @param {String} type    serviceType enum value for layer
 * @param {String} name    property in json parameter containing a service name
 * @param {String} url     url we are investigating
 * @param {Object} json    data result from service we interrogated
 * @returns {Object}
 */
function makeLayerInfo(type, name, url, json) {
    const info = makeInfo(type);
    info.serviceName = json[name] || '';
    info.rootUrl = url;
    if (type === serviceType.TileService) {
        info.tileSupport = true;
        info.serviceType = serviceType.DynamicService;
    }
    return info;
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
            'Group Layer': serviceType.GroupLayer,
            'FeatureCollection': serviceType.WFS
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
        return serviceType.FeatureService;

    } else if (srvJson.hasOwnProperty('allowedMosaicMethods')) {
        // an image server
        return serviceType.ImageService;

    } else {
        return serviceType.Unknown;
    }
}

/**
 * handles the situation where our first poke revealed a child layer
 * (i.e. an indexed endpoint in an arcgis server). We need to extract
 * some extra information about the service it resides in (the root service)
 * and add it to our info package.
 *
 * @param {String} url          the url of the original endpoint (including the index)
 * @param {Object} esriBundle   has ESRI API objects
 * @param {Object} childInfo    the information we have gathered on the child layer from the first poke
 * @returns {Promise}           resolves with information object containing child and root information
 */
function repokeEsriService(url, esriBundle, childInfo) {

    // break url into root and index
    const re = /\/(\d+)\/?$/;
    const matches = url.match(re);
    if (!matches) {
        // give up, dont crash with error.
        console.warn('Cannot extract layer index from url ' + url);
        return Promise.resolve(childInfo);
    }

    childInfo.index = parseInt(matches[1]);
    childInfo.rootUrl = url.substr(0, url.length - matches[0].length); // will drop trailing slash

    // inspect the server root
    return pokeEsriService(childInfo.rootUrl, esriBundle).then(rootInfo => {
        // take relevant info from root, mash it into our child package
        childInfo.tileSupport = rootInfo.tileSupport;
        childInfo.serviceType = rootInfo.serviceType;
        childInfo.layers = rootInfo.layers;
        return childInfo;
    });
}

// given a URL, attempt to read it as an ESRI rest endpoint.
// returns a promise that resovles with an information object.
// at minimum, the object will have a .serviceType property with a value from the above enumeration.
// if the type is .Unknown, then we were unable to determine the url was an ESRI rest endpoint.
// otherwise, we were successful, and the information object will have other properties depending on the service type
// - .name : scraped from service, but may be rubbish (depends on service publisher). used as UI suggestion only
// - .fields : for feature layer service only. list of fields to allow user to pick name field
// - .geometryType : for feature layer service only.  for help in defining the renderer, if required.
// - .layers : for dynamic layer service only. lists the child layers
function pokeEsriService(url, esriBundle, hint) {

    // reaction functions to different esri services
    const srvHandler = {};

    srvHandler[serviceType.FeatureLayer] = srvJson => {
        const info = makeLayerInfo(serviceType.FeatureLayer, 'name', url, srvJson);
        info.fields = srvJson.fields;
        info.geometryType = srvJson.geometryType;
        info.smartDefaults = {
            // TODO: try to find a name field if possible
            primary: info.fields[0].name // pick the first field as primary and return its name for ui binding
        };
        info.indexType = serviceType.FeatureLayer;
        return repokeEsriService(url, esriBundle, info);
    };

    srvHandler[serviceType.RasterLayer] = srvJson => {
        const info = makeLayerInfo(serviceType.RasterLayer, 'name', url, srvJson);
        info.indexType = serviceType.RasterLayer;
        return repokeEsriService(url, esriBundle, info);
    };

    srvHandler[serviceType.GroupLayer] = srvJson => {
        const info = makeLayerInfo(serviceType.GroupLayer, 'name', url, srvJson);
        info.indexType = serviceType.GroupLayer;
        return repokeEsriService(url, esriBundle, info);
    };

    srvHandler[serviceType.TileService] = srvJson => {
        const info = makeLayerInfo(serviceType.TileService, 'mapName', url, srvJson);
        info.layers = srvJson.layers;
        return info;
    };

    srvHandler[serviceType.DynamicService] = srvJson => {
        const info = makeLayerInfo(serviceType.DynamicService, 'mapName', url, srvJson);
        info.layers = srvJson.layers;
        return info;
    };

    srvHandler[serviceType.FeatureService] = srvJson => {
        const info = makeLayerInfo(serviceType.FeatureService, 'description', url, srvJson);
        info.layers = srvJson.layers;
        return info;
    };

    srvHandler[serviceType.ImageService] = srvJson => {
        const info = makeLayerInfo(serviceType.ImageService, 'name', url, srvJson);
        info.fields = srvJson.fields;
        return info;
    };

    srvHandler[serviceType.WFS] = srvJson => {
        const info = makeInfo(serviceType.WFS);
        info.geoJson = srvJson;
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
            let resultType = crawlEsriService(srvResult);

            if (hint && resultType !== hint) {
                // our hint doesn't match the service
                resultType = serviceType.Unknown;
            }
            resolve(srvHandler[resultType](srvResult));

        }, () => {
            // something went wrong, but that doesnt mean our service is invalid yet
            // it's likely not ESRI.  return Error and let main predictor keep investigating
            resolve(makeInfo(serviceType.Error));
        });
    });
}

// tests a URL to see if the value is a file
// providing the known type as a hint will cause the function to run the
// specific logic for that file type, rather than guessing and trying everything
// resolves with promise of information object
// - serviceType : the type of file (CSV, Shape, GeoJSON, Unknown)
// - fileData : if the file is located on a server, will xhr
function pokeFile(url, hint) {
        // reaction functions to different files
        // overkill right now, as files just identify the type right now
        // but structure will let us enhance for custom things if we need to
        const fileHandler = {};

        // csv
        fileHandler[serviceType.CSV] = () => {
            return makeInfo(serviceType.CSV);
        };

        // geojson
        fileHandler[serviceType.GeoJSON] = () => {
            return makeInfo(serviceType.GeoJSON);
        };

        // csv
        fileHandler[serviceType.Shapefile] = () => {
            return makeInfo(serviceType.Shapefile);
        };

        // couldnt figure it out
        fileHandler[serviceType.Unknown] = () => {
            // dont supply url, as we don't want to download random files
            return makeInfo(serviceType.Unknown);
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
                    default:
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

// tests a URL to see if the value is a wfs
// resolves with promise of information object
// - serviceType : the type of service (WFS, Unknown)
function pokeWfs(url, esriBundle) {
    // FIXME add some WFS detection logic.  that would be nice

    console.log(url, esriBundle); // to stop jslint from quacking. remove when params are actually used

    return Promise.resolve(makeInfo(serviceType.WFS));
}

/**
  * @method predictFileUrlBuilder
  * @param {String} url a url to something that is hopefully a map service
  * @returns {Promise} a promise resolving with an infomation object
  */
function predictFileUrlBuilder(esriBundle) {
    return (url) => {
        return new Promise(resolve => {
            // it was a file. rejoice.
            pokeFile(url).then(infoFile => {
                resolve(infoFile);
            });
        });
    }
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
    * - groupIdx: property only available if a group layer is queried. it is the layer index of the group layer in the list under its parent dynamic layer
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
            hintToFlavour[serviceType.FeatureLayer] = 'F_ESRI';
            hintToFlavour[serviceType.RasterLayer] = 'F_ESRI';
            hintToFlavour[serviceType.GroupLayer] = 'F_ESRI';
            hintToFlavour[serviceType.TileService] = 'F_ESRI';
            hintToFlavour[serviceType.DynamicService] = 'F_ESRI';
            hintToFlavour[serviceType.ImageService] = 'F_ESRI';
            hintToFlavour[serviceType.WMS] = 'F_WMS';
            hintToFlavour[serviceType.WFS] = 'F_WFS';

            flavourToHandler.F_ESRI = () => {
                return pokeEsriService(url, esriBundle, hint);
            };

            flavourToHandler.F_WMS = () => {
                // FIXME REAL LOGIC COMING SOON
                return pokeWms(url, esriBundle);
            };

            flavourToHandler.F_WFS = () => {
                // FIXME REAL LOGIC COMING SOON
                return pokeWfs(url, esriBundle);
            }

            // execute handler.  hint -> flavour -> handler -> run it -> promise
            return flavourToHandler[hintToFlavour[hint]]();
        } else {
            return new Promise(resolve => {
                // no hint. run tests until we find a match.
                // not a file, test for ESRI
                pokeEsriService(url, esriBundle).then(infoEsri => {
                    if (infoEsri.serviceType === serviceType.Unknown ||
                        infoEsri.serviceType === serviceType.Error) {

                        // FIXME REAL LOGIC COMING SOON
                        // pokeWMS
                        resolve(infoEsri);
                    } else {
                        // it was a esri service. rejoice.

                        // shortlived rejoice because grouped layers lul
                        if (infoEsri.serviceType === serviceType.GroupLayer) {
                            const lastSlash = url.lastIndexOf('/');
                            const layerIdx = parseInt(url.substring(lastSlash + 1));
                            url = url.substring(0, lastSlash);
                            pokeEsriService(url, esriBundle).then(infoDynamic => {
                                infoDynamic.groupIdx = layerIdx;
                                resolve(infoDynamic);
                            });
                        } else {
                            resolve(infoEsri);
                        }
                    }
                });
            });
        }

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
    return new TextDecoder('utf-8').decode(new Uint8Array(buffer));
}

/**
* Performs validation on GeoJson object. Returns a promise resolving with the validation object.
* Worker function for validateFile, see that file for return value specs
*
* @method validateGeoJson
* @private
* @param {Object} geoJson feature collection in geojson form
* @returns {Promise} promise resolving with information on the geoJson object
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

    if (! geoJson.features) {
        return Promise.reject(new Error('File is missing the attribute "features"'));
    }

    const fields = extractFields(geoJson);
    const oid = 'OBJECTID';

    // object id will be added by the loader later, so present it as an option for the user to pick
    if (fields.indexOf(f => f.name === oid) === -1) {
        fields.push({ name: oid, type: 'esriFieldTypeString' });
    }

    const res = {
        fields: fields,
        geometryType: geomMap[geoJson.features[0].geometry.type],
        formattedData: geoJson,
        smartDefaults: {
            // TODO: try to find a name field if possible
            primary: fields[0].name // pick the first field as primary and return its name for ui binding
        }
    };

    if (!res.geometryType) {
        return Promise.reject(new Error('Unexpected geometry type in GeoJSON'));
    }

    // TODO optional check: iterate through every feature, ensure geometry type and properties are all identical

    return Promise.resolve(res);
}

/**
* Performs validation on csv data. Returns a promise resolving with the validation object.
* Worker function for validateFile, see that file for return value specs
*
* @method validateCSV
* @private
* @param {Object} data csv data as string
* @returns {Promise} promise resolving with information on the csv data
*/
function validateCSV(data) {

    const formattedData = arrayBufferToString(data); // convert from arraybuffer to string to parsed csv. store string format for later
    const rows = csvPeek(formattedData, ','); // FIXME: this assumes delimiter is a `,`; need validation
    let errorMessage; // error message if any to return

    // validations
    if (rows.length < 2) {
        // fail, not enough rows
        errorMessage = 'File does not have enough rows';
    } else {
        // field count of first row.
        const fc = rows[0].length;
        if (fc < 2) {
            // fail not enough columns
            errorMessage = 'File has less than two columns';
        } else {
            if ((new Set(rows[0])).size < rows[0].length) {
                errorMessage = 'File has duplicate column names';
            // check field counts of each row
            } else if (rows.every(rowArr => rowArr.length === fc)) {
                const latRange = [-90, 90];
                const longRange = [-180, 180];

                // candidate fields for latitude and longitude
                const latCandidates = findNumbericalCandidates(rows, latRange);
                const longCandidates = findNumbericalCandidates(rows, longRange);

                // reject if no latitude or longitude candidates were found
                if (latCandidates.length === 0 || longCandidates.length === 0) {
                    return Promise.reject(new Error('Invalid csv format'));
                }

                const res = {
                    formattedData,

                    // default display fields
                    smartDefaults: guessCSVfields(rows, latCandidates, longCandidates),

                    // candidate fields for latitude and longitude wrapped in an object with an esri type
                    latFields: latCandidates.map(field => ({
                        name: field,
                        type: 'esriFieldTypeString'
                    })),
                    longFields: longCandidates.map(field => ({
                            name: field,
                            type: 'esriFieldTypeString'
                    })),

                    // make field list esri-ish for consistancy
                    fields: rows[0].map(field => ({
                        name: field,
                        type: 'esriFieldTypeString'
                    })),
                    geometryType: 'esriGeometryPoint' // always point for CSV
                };

                return Promise.resolve(res);
            } else {
                errorMessage = 'File has inconsistent column counts';
            }
        }
    }

    return Promise.reject(new Error(errorMessage));
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

    const fileHandler = { // maps handlers for different file types
        [serviceType.CSV]: data => validateCSV(data),

        [serviceType.GeoJSON]: data => {
            const geoJson = JSON.parse(arrayBufferToString(data));
            return validateGeoJson(geoJson);
        },

        // convert from arraybuffer (containing zipped shapefile) to json (using shp library)
        [serviceType.Shapefile]: data =>
            shp(data).then(geoJson =>
                validateGeoJson(geoJson))
    };

    // trigger off the appropriate handler, return promise
    return fileHandler[type](data);
}

/**
 * From provided CSV data, guesses which columns are long and lat with in the canadidates.
 * If guessing is no successful, returns null for one or both fields.
 *
 * @method guessCSVfields
 * @private
 * @param  {Array} rows csv data
 * @param  {Array} latCandidates list of all the valid latitude fields
 * @param  {Array} longCandidates list of all the valid longitude fields
 * @return {Object}      an object with lat and long string properties indicating corresponding field names
 */
function guessCSVfields(rows, latCandidates, longCandidates) {
    const latNameRegex = new RegExp(/^.*(y|lat).*$/i);
    const longNameRegex = new RegExp(/^.*(x|long).*$/i);

    // pick the candidate most likely to be the latitude
    let lat = latCandidates[0] || null;
    for (let i in latCandidates) {
        if (latNameRegex.test(latCandidates[i])) {
            lat = latCandidates[i];
            break;
        }
    }

    // pick the candidate most likely to be the longitude
    let long = longCandidates.find(field => field !== lat) || null;
    for (let j in longCandidates) {
        if (longNameRegex.test(longCandidates[j]) && longCandidates[j] !== lat) {
            long = longCandidates[j];
            break;
        }
    }

    // for primary field, pick the first on that is not lat or long field or null
    const primary = rows[0].find(field => field !== lat && field !== long) || null;

    return {
        lat,
        long,
        primary
    };
}

/**
 * Find the suitable candidate fields that passes the regular expressions specified
 *
 * @method findCandidates
 * @private
 * @param  {Array} rows csv data
 * @param {RegExp} regular expression for the value of the field
 * @param {Array} range the range of the candidate cell values should be within.  range[0] is the lower limit and
 * range[1] is the upper limit.
 * @return {Array} a list of suitable candidate fields
 */
function findNumbericalCandidates(rows, range) {
    const fields = rows[0]; // first row must be headers
    const candidates =
        fields.filter((field, index) =>
            rows.every((row, rowIndex) =>
                // skip first row since it's the header
                rowIndex === 0 || !isNaN(Number(row[index])) && range[0] <= row[index] && row[index] <= range[1]));

    return candidates;
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

            if (opts.layerDefinitions.length > 0) {
                identParams.layerDefinitions = opts.layerDefinitions;
            }

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
* Performs in place assignment of integer ids for a GeoJSON FeatureCollection.
* If at least one feature has an existing id outside the geoJson properties section,
* the original id value is copied in a newly created property ID_FILE of the properties object
* and the existing id value is replaced by an autogenerated number.
* Features without existing id from that same dataset will get a new properties ID_FILE
* with an empty string as value.
**************************************
* If at least one feature has an existing OBJECTID inside the geoJson properties section,
* the original OBJECTID value is copied in a newly created property OBJECTID_FILE of the properties object
* and the existing OBJECTID value is replaced by an autogenerated number.
* Features without existing OBJECTID from that same dataset will get a new properties OBJECTID_FILE
* with an empty string as value.
*/
function assignIds(geoJson) {
    if (geoJson.type !== 'FeatureCollection') {
        throw new Error('Assignment can only be performed on FeatureCollections');
    }

    let emptyID = true;
    let emptyObjID = true;

    // for every feature, if it does not have an id property, add it.
    // 0 is not a valid object id
    geoJson.features.forEach(function (val, idx) {
        Object.assign(val.properties, { ID_FILE: '', OBJECTID_FILE: '' });

        // to avoid double ID columns outside properties
        if ('id' in val && typeof val.id !== 'undefined') {
            val.properties.ID_FILE = val.id;
            emptyID = false;
        }

        // to avoid double OBJECTID columns. Useful for both geojson and CSV file.
        if ('OBJECTID' in val.properties) {
            val.properties.OBJECTID_FILE = val.properties.OBJECTID;
            delete val.properties.OBJECTID;
            emptyObjID = false;
        }

        val.id = idx + 1;
    });

    // remove ID_FILE if all empty
    if (emptyID) {
        geoJson.features.forEach(function (val) {
            delete val.properties.ID_FILE;
        });
    }

    // remove OBJECTID_FILE if all empty
    if (emptyObjID) {
        geoJson.features.forEach(function (val) {
            delete val.properties.OBJECTID_FILE;
        });
    }
}

/**
 * Extracts fields from the first feature in the feature collection, does no
 * guesswork on property types and calls everything a string.
 */
function extractFields(geoJson) {
    if (geoJson.features.length < 1) {
        throw new Error('Field extraction requires at least one feature');
    }

    if (geoJson.features[0].properties) {
        return Object.keys(geoJson.features[0].properties).map(function (prop) {
            return { name: prop, type: 'esriFieldTypeString' };
        });
    } else {
        return [];
    }
}

/**
 * Rename any fields with invalid names. Both parameters are modified in place.
 *
 * @function cleanUpFields
 * @param {Object} geoJson           layer data in geoJson format
 * @param {Object} layerDefinition   layer definition of feature layer not yet created
 */
function cleanUpFields(geoJson, layerDefinition) {
    const badField = name => {
        // basic for now. check for spaces.
        return name.indexOf(' ') > -1;
    };

    layerDefinition.fields.forEach(f => {
        if (badField(f.name)) {
            const oldField = f.name;
            let newField;
            let underscore = '_';
            let badNewName;

            // determine a new field name that is not bad and is unique, then update the field definition
            do {
                newField = oldField.replace(/ /g, underscore);
                badNewName = layerDefinition.fields.find(f2 => f2.name === newField);
                if (badNewName) {
                    // new field already exists. enhance it
                    underscore += '_';
                }
            } while (badNewName)

            f.alias = oldField;
            f.name = newField;

            // update the geoJson to reflect the field name change.
            geoJson.features.forEach(gf => {
                gf.properties[newField] = gf.properties[oldField];
                delete gf.properties[oldField];
            });
        }
    });

}

function makeGeoJsonLayerBuilder(esriBundle, geoApi) {

    /**
    * Converts a GeoJSON object into a FeatureLayer.  Expects GeoJSON to be formed as a FeatureCollection
    * containing a uniform feature type (FeatureLayer type will be set according to the type of the first
    * feature entry).  Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid to project geometries to
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - sourceProjection: a string matching a proj4.defs projection to be used for the source data (overrides
    *     geoJson.crs)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    *   - layerId: a string to use as the layerId
    *   - colour: a hex string to define the symbol colour. e.g. '#33DD6A'
    *
    * @method makeGeoJsonLayer
    * @param {Object} geoJson An object following the GeoJSON specification, should be a FeatureCollection with
    * Features of only one type
    * @param {Object} opts An object for supplying additional parameters
    * @returns {Promise} a promise resolving with a {FeatureLayer}
    */
    return (geoJson, opts) => {

        // NOTE we used to have a 'fields' option where a caller could specify a custom field list.
        //      this was problematic as changes made by assignIds would not be reflected in the
        //      supplied list. Our UI currently has no way of doing custom lists; it just
        //      throws every field in, so technically it's not used / not required.
        //      If we decide we need this, we can add it back, and will need to either
        //      a) stop the standard file load wizard from passing the .fields option.
        //      b) write code here that synchs the .fields option with any changes
        //         made by assignIds

        // TODO add documentation on why we only support layers with WKID (and not WKT).
        let targetWkid;
        let srcProj = 'EPSG:4326'; // 4326 is the default for GeoJSON with no projection defined
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

            if (opts.layerId) {
                layerId = opts.layerId;
            } else {
                layerId = geoApi.shared.generateUUID();
            }

            // TODO add support for renderer option, or drop the option

        } else {
            throw new Error('makeGeoJsonLayer - missing opts arguement');
        }

        if (layerDefinition.fields.length === 1) {
            // caller has not supplied custom field list. so take them all.
            layerDefinition.fields = layerDefinition.fields.concat(extractFields(geoJson));
        }

        // clean the fields. in particular, CSV files can be loaded with spaces in
        // the field names
        cleanUpFields(geoJson, layerDefinition);

        const destProj = 'EPSG:' + targetWkid;

        // look up projection definitions if they don't already exist and we have enough info
        const srcLookup = geoApi.proj.checkProj(srcProj, opts.epsgLookup);
        const destLookup =  geoApi.proj.checkProj(destProj, opts.epsgLookup);

        // make the layer
        const buildLayer = () => {
            return new Promise(resolve => {
                // project data and convert to esri json format
                // console.log('reprojecting ' + srcProj + ' -> EPSG:' + targetWkid);
                geoApi.proj.projectGeojson(geoJson, destProj, srcProj);
                const esriJson = Terraformer.ArcGIS.convert(geoJson, { sr: targetWkid });
                const geometryType = layerDefinition.drawingInfo.geometryType;

                const fs = {
                    features: esriJson,
                    geometryType
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

                if (opts.colour) {
                    layer.renderer.symbol.color = new esriBundle.Color(opts.colour);
                }

                // initializing layer using JSON does not set this property. do it manually.
                layer.geometryType = geometryType;
                resolve(layer);
            });
        };

        // call promises in order
        return srcLookup.lookupPromise
            .then(() => destLookup.lookupPromise)
            .then(() => buildLayer());

    };
}

function makeCsvLayerBuilder(esriBundle, geoApi) {

    /**
    * Constructs a FeatureLayer from CSV data. Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid the spatial reference the returned layer should be in
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - latfield: a string identifying the field containing latitude values ('Lat' by default)
    *   - lonfield: a string identifying the field containing longitude values ('Long' by default)
    *   - delimiter: a string defining the delimiter character of the file (',' by default)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    *   - layerId: a string to use as the layerId
    *   - colour: a hex string to define the symbol colour. e.g. '#33DD6A'
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
    return csv2geojson.dsv.dsvFormat(delimiter).parseRows(csvData);
}

function makeShapeLayerBuilder(esriBundle, geoApi) {

    /**
    * Constructs a FeatureLayer from Shapefile data. Accepts the following options:
    *   - targetWkid: Required. an integer for an ESRI wkid the spatial reference the returned layer should be in
    *   - renderer: a string identifying one of the properties in defaultRenders
    *   - sourceProjection: a string matching a proj4.defs projection to be used for the source data (overrides
    *     geoJson.crs)
    *   - epsgLookup: a function that takes an EPSG code (string or number) and returns a promise of a proj4 style
    *     definition or null if not found
    *   - layerId: a string to use as the layerId
    *   - colour: a hex string to define the symbol colour. e.g. '#33DD6A'
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

function createImageRecordBuilder(esriBundle, geoApi, classBundle) {
    /**
    * Creates an Image Layer Record class
    * @param {Object} config         layer config values
    * @param {Object} esriLayer      an optional pre-constructed layer
    * @param {Function} epsgLookup   an optional lookup function for EPSG codes (see geoService for signature)
    * @returns {Object}              instantited ImageRecord class
    */
    return (config, esriLayer, epsgLookup) => {
        return new classBundle.ImageRecord(esriBundle.ArcGISImageServiceLayer, geoApi, config, esriLayer, epsgLookup);
    };
}

function createFeatureRecordBuilder(esriBundle, geoApi, classBundle) {
    /**
    * Creates an Feature Layer Record class
    * @param {Object} config         layer config values
    * @param {Object} esriLayer      an optional pre-constructed layer
    * @param {Function} epsgLookup   an optional lookup function for EPSG codes (see geoService for signature)
    * @returns {Object}              instantited FeatureRecord class
    */
    return (config, esriLayer, epsgLookup) => {
        return new classBundle.FeatureRecord(esriBundle.FeatureLayer, esriBundle.esriRequest,
            geoApi, config, esriLayer, epsgLookup);
    };
}

function createGraphicsRecordBuilder(esriBundle, geoApi, classBundle) {
    /**
    * Creates a Graphics Layer Record class
    * @param {String} name           name and id of the layer to be constructed
    * @returns {Object}              instantited GraphicsRecord class
    */
    return name => {
        return new classBundle.GraphicsRecord(esriBundle, geoApi, name);
    };
}

function createDynamicRecordBuilder(esriBundle, geoApi, classBundle) {
    /**
     * Creates an Dynamic Layer Record class
     * See DynamicRecord constructor for more detailed info on configIsComplete.
     *
     * @param {Object} config              layer config values
     * @param {Object} esriLayer           an optional pre-constructed layer
     * @param {Function} epsgLookup        an optional lookup function for EPSG codes (see geoService for signature)
     * @param {Boolean} configIsComplete   an optional flag to indicate all child state values are provided in the config and should be used.
     * @returns {Object}                   instantited DynamicRecord class
     */
    return (config, esriLayer, epsgLookup, configIsComplete = false) => {
        return new classBundle.DynamicRecord(esriBundle.ArcGISDynamicMapServiceLayer, esriBundle.esriRequest,
            geoApi, config, esriLayer, epsgLookup, configIsComplete);
    };
}

function createTileRecordBuilder(esriBundle, geoApi, classBundle) {
    /**
    * Creates an Tile Layer Record class
    * @param {Object} config         layer config values
    * @param {Object} esriLayer      an optional pre-constructed layer
    * @param {Function} epsgLookup   an optional lookup function for EPSG codes (see geoService for signature)
    * @returns {Object}              instantited TileRecord class
    */
    return (config, esriLayer, epsgLookup) => {
        return new classBundle.TileRecord(esriBundle.ArcGISTiledMapServiceLayer, geoApi, config,
            esriLayer, epsgLookup);
    };
}

function createWmsRecordBuilder(esriBundle, geoApi, classBundle) {
    /**
    * Creates an WMS Layer Record class
    * @param {Object} config         layer config values
    * @param {Object} esriLayer      an optional pre-constructed layer
    * @param {Function} epsgLookup   an optional lookup function for EPSG codes (see geoService for signature)
    * @returns {Object}              instantited WmsRecord class
    */
    return (config, esriLayer, epsgLookup) => {
        return new classBundle.WmsRecord(esriBundle.WmsLayer, geoApi, config, esriLayer, epsgLookup);
    };
}

/**
* Given 2D array in column x row format, check if all entries in the two given columns are numeric.
*
* @param {Array} arr is a 2D array based on the CSV file that contains row information for all of the rows
* @param {Integer} ind1 is a user specified index when uploading the CSV that specifies lat or long column (whichever isn't specified by ind2)
* @param {Integer} ind2 is a user specified index when uploading the CSV that specifies lat or long column (whichever isn't specified by ind1)
* @return {Boolean} returns true or false based on whether or not all all columns at ind1 and ind2 are numbers
*/
function validateLatLong(arr, ind1, ind2) {
    return arr.every(row => {
        return !(isNaN(row[ind1]) || isNaN(row[ind2]));
    });
}

// CAREFUL NOW!
// we are passing in a reference to geoApi.  it is a pointer to the object that contains this module,
// along with other modules. it lets us access other modules without re-instantiating them in here.
module.exports = function (esriBundle, geoApi) {

    const layerClassBundle = layerRecord(esriBundle, geoApi);

    return {
        ArcGISDynamicMapServiceLayer: esriBundle.ArcGISDynamicMapServiceLayer,
        ArcGISImageServiceLayer: esriBundle.ArcGISImageServiceLayer,
        GraphicsLayer: esriBundle.GraphicsLayer,
        FeatureLayer: esriBundle.FeatureLayer,
        ScreenPoint: esriBundle.ScreenPoint,
        Query: esriBundle.Query,
        TileLayer: esriBundle.ArcGISTiledMapServiceLayer,
        ImageParameters: esriBundle.ImageParameters,
        ogc: ogc(esriBundle),
        bbox: bbox(esriBundle, geoApi),
        createImageRecord: createImageRecordBuilder(esriBundle, geoApi, layerClassBundle),
        createWmsRecord: createWmsRecordBuilder(esriBundle, geoApi, layerClassBundle),
        createWfsRecord: createFeatureRecordBuilder(esriBundle, geoApi, layerClassBundle),
        createTileRecord: createTileRecordBuilder(esriBundle, geoApi, layerClassBundle),
        createDynamicRecord: createDynamicRecordBuilder(esriBundle, geoApi, layerClassBundle),
        createFeatureRecord: createFeatureRecordBuilder(esriBundle, geoApi, layerClassBundle),
        createGraphicsRecord: createGraphicsRecordBuilder(esriBundle, geoApi, layerClassBundle),
        LayerDrawingOptions: esriBundle.LayerDrawingOptions,
        makeGeoJsonLayer: makeGeoJsonLayerBuilder(esriBundle, geoApi),
        makeCsvLayer: makeCsvLayerBuilder(esriBundle, geoApi),
        makeShapeLayer: makeShapeLayerBuilder(esriBundle, geoApi),
        serverLayerIdentify: serverLayerIdentifyBuilder(esriBundle),
        predictFileUrl: predictFileUrlBuilder(esriBundle),
        predictLayerUrl: predictLayerUrlBuilder(esriBundle),
        validateFile,
        validateGeoJson,
        csvPeek,
        serviceType,
        validateLatLong
    };
};
