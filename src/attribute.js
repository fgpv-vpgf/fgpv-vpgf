'use strict';

/*
Structure and naming:

this is a layer Package.  it contains information about a single server-side layer.
note this is not always 1-to-1 with client side. a client side DynamicLayer can have
many server-side sublayers, each with their own attribute sets

DO NOT access the ._attribData property directly, as it will not exist until the first
request for attributes.  use the function .getAttribs(), as it will properly handle the
initial request, or return the previously loaded result (always as a promise)

{
    "layerId": "<layerid>",
    "featureIdx": 3,
    "getAttribs": getAttribs(),
    "_attribData": Promise(
        <instance of a attribute data object, see below>
    ),
    "layerData":  Promise(
        <instance of a layer data object, see below>
    )
}

this is an attribute data object.  it resides in a promise (as the data needs to be downloaded)
it contains the attribute data as an array, and an index mapping object id to array position
{
    "features": [
        {
            "attributes": {
                "objectid": 23,
                "name": "Bruce",
                "age": 27
            }
        },
        ...
    ],
    "oidIndex": {
        "23": 0,
        ...
    }
}

this is a layer data object.  it contains information describing the server-side layer
{
    "fields: [
        {
            "name": "objectid",
            "type": "esriFieldTypeOID",
            "alias": "OBJECTID"
        },
        ...
    ],
    "oidField": "objectid",
    "renderer": {...},
    "geometryType": "esriGeometryPoint",
    "layerType": "Feature Layer",
    "minScale": 0,
    "maxScale": 0,
    "extent": {...}
}

*/

/**
 * Will generate an empty object structure to store attributes for a single layer of features
 * @private
 * @param  {String} featureIdx server index of the layer
 * @param  {Object} esriBundle bundle of API classes
 * @return {Object} empty layer package object
 */
function newLayerPackage(featureIdx, esriBundle) {
    // only reason this is in a function is to tack on the lazy-load
    // attribute function. all object properties are added elsewhere
    const layerPackage = {
        featureIdx,
        getAttribs,
        loadedFeatureCount: 0,
        loadAbortFlag: false,
        loadIsDone: false,
        abortAttribLoad
    };

    /**
     * Return promise of attribute data object. First request triggers load
     * @private
     * @return {Promise} promise of attribute data object
     */
    function getAttribs() {
        if (layerPackage._attribData) {
            // attributes have already been downloaded.
            return layerPackage._attribData;
        }

        // first request for data. create the promise
        layerPackage.loadAbortFlag = false;
        layerPackage.loadedFeatureCount = 0;
        layerPackage._attribData = new Promise((resolve, reject) => {

            // first wait for the layer specific data to finish loading
            // NOTE: by the time the application has access to getAttribs(), the .layerData
            //       property will have been created.
            layerPackage.layerData.then(layerData => {
                // FIXME switch to native Promise
                const defFinished = new esriBundle.Deferred();
                const params = {
                    maxId: -1,
                    batchSize: -1,
                    layerUrl: layerData.load.layerUrl,
                    oidField: layerData.oidField,
                    attribs: layerData.load.attribs,
                    supportsLimit: layerData.load.supportsLimit,
                    esriBundle,
                    layerPackage
                };

                // begin the loading process
                loadDataBatch(params, defFinished);

                // after all data has been loaded
                defFinished.promise.then(features => {
                    delete layerData.load; // no longer need this info
                    layerPackage.loadIsDone = true;

                    // resolve the promise with the attribute set
                    resolve(createAttribSet(layerData.oidField, features));
                }, error => {
                    console.warn('error getting attribute data for ' + layerData.load.layerUrl);

                    // attrib data deleted so the first check for attribData doesn't return a rejected promise
                    delete layerPackage._attribData;
                    reject(error);
                });
            });
        });

        return layerPackage._attribData;
    }

    /**
     * Attempts to stop an attribute load process. Will only abort if current load
     * is not the final batch of data.
     * @private
     */
    function abortAttribLoad() {
        layerPackage.loadAbortFlag = true;
    }

    return layerPackage;
}

/**
* Will generate attribute package with object id indexes
* @private
* @param  {String} oidField field containing object id
* @param  {Array} featureData feature objects to index and return
* @return {Object} object containing features and an index by object id
*/
function createAttribSet(oidField, featureData) {

    // add new data to layer data's array
    const res = {
        features: featureData,
        oidIndex: {}
    };

    // make index on object id
    featureData.forEach((elem, idx) => {
        // map object id to index of object in feature array
        // use toString, as objectid is integer and will act funny using array notation.
        res.oidIndex[elem.attributes[oidField].toString()] = idx;
    });

    return res;
}

// skim the last number off the Url
// TODO apply more edge case tests to this function
function getLayerIndex(layerUrl) {
    const re = /\/(\d+)\/?$/;
    const matches = layerUrl.match(re);
    if (matches) {
        return parseInt(matches[1]);
    }
    throw new Error('Cannot extract layer index from url ' + layerUrl);
}

/**
 * Recursive function to load a full set of attributes, regardless of the maximum output size of the service.
 * Passes result back on the provided Deferred object.
 *
 * @private
 * @param  {Object} opts options object that consists of these properties
 *         - maxId: integer, largest object id that has already been downloaded.
 *         - supportsLimit: boolean, indicates if server result will notify us if our request surpassed the record limit.
 *         - batchSize: integer, maximum number of results the service will return. if -1, means currently unknown. only required if supportsLimit is false.
 *         - layerUrl: string, URL to feature layer endpoint.
 *         - oidField: string, name of attribute containing the object id for the layer.
 *         - attribs: string, a comma separated list of attributes to download. '*' will download all.
 *         - esriBundle: object, standard set of ESRI API objects.
 *         - layerPackage: reference to the object that manages the loaded attributes
 * @param  {Object} callerDef deferred object that resolves when current data has been downloaded
 */
function loadDataBatch(opts, callerDef) {

    if (opts.layerPackage.loadAbortFlag) {
        delete opts.layerPackage._attribData;
        opts.layerPackage.loadedFeatureCount = 0;
        callerDef.reject('ABORTED');
        return;
    }

    //  fetch attributes from feature layer. where specifies records with id's higher than stuff already
    //  downloaded. no geometry.
    // FIXME replace esriRequest with a library that handles proxies better
    const defData = opts.esriBundle.esriRequest({
        url: opts.layerUrl + '/query',
        content: {
            where: opts.oidField + '>' + opts.maxId,
            outFields: opts.attribs,
            returnGeometry: 'false',
            f: 'json',
        },
        callbackParamName: 'callback',
        handleAs: 'json'
    });

    defData.then(dataResult => {
        if (dataResult.features) {
            const len = dataResult.features.length;
            if (len > 0) {
                // figure out if we hit the end of the data. different logic for newer vs older servers.
                opts.layerPackage.loadedFeatureCount += len;
                let moreData;
                if (opts.supportsLimit) {
                    moreData = dataResult.exceededTransferLimit;
                } else {
                    if (opts.batchSize === -1) {
                        // this is our first batch. set the max batch size to this batch size
                        opts.batchSize = len;
                    }
                    moreData = (len >= opts.batchSize);
                }

                if (moreData) {
                    // stash the result and call the service again for the next batch of data.
                    // max id becomes last object id in the current batch
                    const thisDef = new opts.esriBundle.Deferred();
                    opts.maxId = dataResult.features[len - 1].attributes[opts.oidField];
                    loadDataBatch(opts, thisDef);

                    thisDef.then(dataArray => {
                        // chain the next result to our current result, then pass back to caller
                        callerDef.resolve(dataResult.features.concat(dataArray));
                    },

                    error => {
                        callerDef.reject(error);
                    });
                } else {
                    // done thanks
                    callerDef.resolve(dataResult.features);
                }
            } else {
                // no more data.  we are done
                callerDef.resolve([]);
            }
        } else {
            // it is possible to have an error, but it comes back on the "success" channel.
            callerDef.reject(dataResult.error);
        }
    },

    error => {
        callerDef.reject(error);
    });
}

function loadServerAttribsBuilder(esriBundle, geoApi) {

    /**
    * fetch attributes from an ESRI ArcGIS Server Feature Layer Service endpoint
    * @param {String} mapServiceUrl   an arcgis map server service endpoint (no integer index)
    * @param {String} featureIdx      index of where the endpoint is.
    * @param {String} attribs         an optional comma separated list of attributes to download. default '*' will download all
    * @return {Object} attributes in a packaged format for asynch access
    */
    return (mapServiceUrl, featureIdx, attribs = '*') => {

        const layerUrl = mapServiceUrl + '/' + featureIdx;
        const layerPackage = newLayerPackage(featureIdx, esriBundle);

        // get information about this layer, asynch
        layerPackage.layerData = new Promise((resolve, reject) => {
            const layerData = {};

            // extract info for this service
            const defService = esriBundle.esriRequest({
                url: layerUrl,
                content: { f: 'json' },
                callbackParamName: 'callback',
                handleAs: 'json',
            });

            defService.then(serviceResult => {
                if (serviceResult && (typeof serviceResult.error === 'undefined')) {

                    // properties for all endpoints
                    layerData.layerType = serviceResult.type;
                    layerData.geometryType = serviceResult.geometryType || 'none'; // TODO need to decide what propert default is. Raster Layer has null gt.
                    layerData.minScale = serviceResult.minScale;
                    layerData.maxScale = serviceResult.maxScale;
                    layerData.supportsFeatures = false; // saves us from having to keep comparing type to 'Feature Layer' on the client
                    layerData.extent = serviceResult.extent;

                    if (serviceResult.type === 'Feature Layer') {
                        layerData.supportsFeatures = true;
                        layerData.fields = serviceResult.fields;
                        layerData.nameField = serviceResult.displayField;

                        // find object id field
                        // NOTE cannot use arrow functions here due to bug
                        const noFieldDefOid = serviceResult.fields.every(function (elem) {
                            if (elem.type === 'esriFieldTypeOID') {
                                layerData.oidField = elem.name;
                                return false; // break the loop
                            }

                            return true; // keep looping
                        });

                        if (noFieldDefOid) {
                            // we encountered a service that does not mark a field as the object id.
                            // attempt to use alternate definition. if neither exists, we are toast.
                            layerData.oidField = serviceResult.objectIdField
                        }

                        // ensure our attribute list contains the object id
                        if (attribs !== '*') {
                            if (attribs.split(',').indexOf(layerData.oidField) === -1) {
                                attribs += (',' + layerData.oidField);
                            }
                        }

                        // add renderer and legend
                        layerData.renderer = geoApi.symbology.cleanRenderer(serviceResult.drawingInfo.renderer,
                            serviceResult.fields);

                        layerData.legend = geoApi.symbology.rendererToLegend(layerData.renderer, featureIdx);
                        geoApi.symbology.enhanceRenderer(layerData.renderer, layerData.legend);

                        // temporarily store things for delayed attributes
                        layerData.load = {
                            // version number is only provided on 10.0 SP1 servers and up.
                            // servers 10.1 and higher support the query limit flag
                            supportsLimit: (serviceResult.currentVersion || 1) >= 10.1,
                            layerUrl,
                            attribs
                        };
                    }

                    // return the layer data promise result
                    resolve(layerData);
                } else {
                    // case where error happened but service request was successful
                    console.warn('Service metadata load error');
                    if (serviceResult && serviceResult.error) {
                        // reject with error
                        reject(serviceResult.error);
                    } else {
                        reject(new Error('Unknown error loading service metadata'));
                    }
                }
            }, error => {
                // failed to load service info. reject with error
                console.warn('Service metadata load error : ' + error);
                reject(error);
            });
        });

        return layerPackage;
    };
}

function loadFileAttribsBuilder(esriBundle, geoApi) {

    return layer => {
        // feature layer was loaded from a file.
        // this approach is inefficient (duplicates attributes in layer and in attribute store),
        // but provides a consistent approach to attributes regardless of where the layer came from

        const layerPackage = newLayerPackage('0', esriBundle); // files have no index (no server), so we use value 0

        // it's local, no need to lazy-load
        layerPackage._attribData = Promise.resolve(createAttribSet(layer.objectIdField, layer.graphics.map(elem => {
            return { attributes: elem.attributes };
        })));

        const renderer = layer.renderer.toJson();
        const legend = geoApi.symbology.rendererToLegend(renderer, 0);
        geoApi.symbology.enhanceRenderer(renderer, legend);

        // TODO revisit the geometry type. ideally, fix our GeoJSON to Feature to populate the property
        layerPackage.layerData = Promise.resolve({
            oidField: layer.objectIdField,
            fields: layer.fields,
            geometryType: layer.geometryType || JSON.parse(layer._json).layerDefinition.drawingInfo.geometryType,
            minScale: layer.minScale,
            maxScale: layer.maxScale,
            layerType: 'Feature Layer',
            renderer,
            legend
        });

        return layerPackage;
    };
}

//  Attribute Loader related functions
// TODO consider re-writing all the asynch stuff with the ECMA-7 style of asynch keywords
module.exports = (esriBundle, geoApi) => {
    return {
        loadServerAttribs: loadServerAttribsBuilder(esriBundle, geoApi),
        loadFileAttribs: loadFileAttribsBuilder(esriBundle, geoApi),
        getLayerIndex
    };
};
