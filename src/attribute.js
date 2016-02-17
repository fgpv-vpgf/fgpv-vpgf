'use strict';

const shared = require('./shared.js');

/**
* Will generate an empty object structure to store attributes for a single layer of features
* @private
* @return {Object} empty layer data object
*/
function newLayerData() {
    return {
        features: [],
        oidField: '',
        oidIndex: {},
        layerId: '',
        layerIdx: null // default value to indicate uninitialized
    };
}

/**
* Will generate an empty object structure to store a bundle of attributes for a full layer
* @private
* @return {Object} empty layer bundle object
*/
function newLayerBundle(layerId) {
    const bundle = {
        layerId, // for easy access to know what layer the results belong to
        indexes: [], // for easy iteration over all indexes in the set
        registerData
    };

    function registerData(layerData) {
        layerData.layerId = bundle.layerId; // layerData is unaware of layerId. assign it during registration
        bundle[layerData.layerIdx.toString()] = layerData;
        bundle.indexes.push(layerData.layerIdx.toString());
    }

    return bundle;
}

/**
* Will generate object id indexes and parent pointers on a layer data object.
* Assumes data object already has object id field defined
* @private
* @param  {Object} layerData layer data object
* @param  {Array} featureData feature objects to enhance and add to layer data
*/
function addLayerData(layerData, featureData) {
    const offset = layerData.features.length;

    // add new data to layer data's array
    layerData.features = layerData.features.concat(featureData);

    // make parent pointers and a fun index on object id
    featureData.forEach((elem, idx) => {
        // map object id to index of object in feature array
        // use toString, as objectid is integer and will act funny using array notation.
        layerData.oidIndex[elem.attributes[layerData.oidField].toString()] = idx + offset;

        // pointer back to parent
        // TODO verify we still have use for the parent pointer
        elem.parent = layerData;
    });
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
* Recursive function to load a full set of attributes, regardless of the maximum output size of the service
* Passes result back on the provided Deferred object
*
* @private
* @param  {Integer} maxId largest object id that has already been downloaded
* @param  {Integer} maxBatch maximum number of results the service will return. if -1, means currently unknown
* @param  {String} layerUrl URL to feature layer endpoint
* @param  {String} idField name of attribute containing the object id for the layer
* @param  {String} attribs a comma separated list of attributes to download. '*' will download all
* @param  {Object} callerDef deferred object that resolves when current data has been downloaded
* @param  {Object} esriBundle bundle of API classes
*/
function loadDataBatch(maxId, maxBatch, layerUrl, idField, attribs, callerDef, esriBundle) {
    //  fetch attributes from feature layer. where specifies records with id's higher than stuff already
    //  downloaded. no geometry.
    // FIXME replace esriRequest with a library that handles proxies better
    const defData = esriBundle.esriRequest({
        url: layerUrl + '/query',
        content: {
            where: idField + '>' + maxId,
            outFields: attribs,
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
                if (maxBatch === -1) {
                    // this is our first batch and our server is 10.0.  set the max batch size to this batch size
                    maxBatch = len;
                }

                if (len < maxBatch) {
                    // this batch is less than the max.  this is last batch.  no need to query again.
                    callerDef.resolve(dataResult.features);
                } else {
                    // stash the result and call the service again for the next batch of data.
                    // max id becomes last object id in the current batch
                    const thisDef = new esriBundle.Deferred();
                    loadDataBatch(dataResult.features[len - 1].attributes[idField], maxBatch,
                        layerUrl, idField, attribs, thisDef, esriBundle);

                    thisDef.then(dataArray => {
                        callerDef.resolve(dataResult.features.concat(dataArray));
                    },

                    error => {
                        callerDef.reject(error);
                    });
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

/**
* fetch attributes from an ESRI ArcGIS Server Feature Layer Service endpoint
* @param {String} layerUrl an arcgis feature layer service endpoint
* @param {String} attribs a comma separated list of attributes to download. '*' will download all
* @param  {Object} esriBundle bundle of API classes
* @return {Promise} promise of attributes in layer bundle format (see newLayerBundle)
*/
function loadFeatureAttribs(layerUrl, attribs, esriBundle) {

    return new Promise((resolve, reject) => {

        // extract info for this service
        const defService = esriBundle.esriRequest({
            url: layerUrl,
            content: { f: 'json' },
            callbackParamName: 'callback',
            handleAs: 'json',
        });

        defService.then(serviceResult => {
            if (serviceResult && (typeof serviceResult.error === 'undefined')) {

                // set up layer data object based on layer data
                // 10.0 server will not supply a max record value
                let maxBatchSize = serviceResult.maxRecordCount || -1;

                // FIXME switch to native Promise
                const defFinished = new esriBundle.Deferred();
                const layerData = newLayerData();

                layerData.layerIdx = getLayerIndex(layerUrl);

                if (serviceResult.type === 'Feature Layer') {

                    // find object id field
                    // NOTE cannot use arrow functions here due to bug
                    serviceResult.fields.every(function (elem) {
                        if (elem.type === 'esriFieldTypeOID') {
                            layerData.oidField = elem.name;
                            return false; // break the loop
                        }

                        return true; // keep looping
                    });

                    // ensure our attribute list contains the object id
                    if (attribs !== '*') {
                        if (attribs.split(',').indexOf(layerData.oidField) === -1) {
                            attribs += (',' + layerData.oidField);
                        }
                    }

                    // begin the loading process
                    loadDataBatch(-1, maxBatchSize, layerUrl, layerData.oidField,
                        attribs, defFinished, esriBundle);

                    // after all data has been loaded
                    defFinished.promise.then(features => {
                        addLayerData(layerData, features);

                        // return the data as part of the promise
                        resolve(layerData);
                    },

                    error => {
                        console.warn('error getting attribute data for ' + layerUrl);

                        // return the error as part of the promise
                        reject(error);
                    });
                } else {
                    // we are interrogating a non-feature layer (such as a Raster Layer)
                    // return the empty attribute set
                    // (should not be error, as dynamic crawler can come across non feature layers)
                    // TODO revist incase we want a differnt return value in this case.
                    resolve(layerData);
                }
            } else {
                // case where error happened but service request was successful
                console.warn('Service metadata load error');
                if (serviceResult && serviceResult.error) {
                    // return the error as part of the promise
                    reject(serviceResult.error);
                } else {
                    reject(new Error('Unknown error loading service metadata'));
                }
            }
        }, error => {
            // return the error as part of the promise
            console.warn('Service metadata load error : ' + error);
            reject(error);
        });
    });
}

// extract the options (including defaults) for a layer index
function pluckOptions(layerIdx, options = {}) {
    // handle missing layer
    const opt = options[layerIdx] || {};

    return {
        skip: opt.skip || false,
        attribs: opt.attribs || '*'
    };
}

/**
* Ochestrate the attribute extraction of a feature layer object.
* @private
* @param  {Object} layer an ESRI API Feature layer object
* @param  {Object} options information on layer and attribute skipping
* @param  {Object} esriBundle bundle of API classes
* @return {Promise} promise of attributes in layer bundle format (see newLayerBundle)
*/
function processFeatureLayer(layer, options, esriBundle) {

    // logic is in separate function to passify the cyclomatic complexity check.
    // TODO we may want to support the option of a layer that points to a server based JSON file containing attributes

    return new Promise(resolve => {
        const result = newLayerBundle(layer.id);

        if (layer.url) {
            const idx = getLayerIndex(layer.url);
            const opts = pluckOptions(idx, options);

            // check for skip flag
            if (opts.skip) {
                resolve(result);
            } else {
                // call loadFeatureAttribs with options if present
                loadFeatureAttribs(layer.url, opts.attribs, esriBundle).then(
                    layerData => {
                        // attribs are loaded
                        // package into final object structure (one instance) and return
                        result.registerData(layerData);
                        resolve(result);
                    }
                );
            }
        } else {
            // feature layer was loaded from a file.
            // this approach is inefficient (duplicates attributes in layer and in attribute store),
            // but provides a consistent approach to attributes regardless of where the layer came from

            const layerData = newLayerData();

            layerData.oidField = layer.objectIdField;
            layerData.layerId = layer.id;
            layerData.layerIdx = 0; // files have no index (no server), so we use value 0

            addLayerData(layerData, layer.graphics.map(elem => {
                return { attributes: elem.attributes };
            }));

            result.registerData(layerData);
            resolve(result);
        }
    });
}

/**
* Ochestrate the attribute extraction of a dynamic map service layer object.
* @private
* @param  {Object} layer an ESRI API Dynamic Map Service layer object
* @param  {Object} options information on layer and attribute skipping
* @param  {Object} esriBundle bundle of API classes
* @return {Promise} promise of attributes in proper format
*/
function processDynamicLayer(layer, options, esriBundle) {

    // logic is in separate function to passify the cyclomatic complexity check.
    // TODO we may want to support the option of a layer that points to a server based JSON file containing attributes
    return new Promise(resolve => {
        let idx = 0;
        let opts;
        const featurePromises = [];
        const lInfo = layer.layerInfos;

        // for each layer leaf.  we use a custom loop as we need to skip sections
        while (idx < lInfo.length) {

            opts = pluckOptions(idx, options);

            //  check if leaf node or group node
            if (lInfo[idx].subLayerIds) {
                // group node

                if (opts.skip) {
                    // skip past all child indexes (thus avoiding processing all children).
                    // group indexes have property .subLayerIds that lists indexes of all immediate child layers
                    // child layers can be group layers as well.
                    // example: to skip Group A (index 0), we crawl to Leaf X (index 4), then add 1 to get to sibling layer Leaf W (index 5)
                    //  [0] Group A
                    //      [1] Leaf Z
                    //      [2] Group B
                    //          [3] Leaf Y
                    //          [4] Leaf X
                    //  [5] Leaf W

                    let lastIdx = idx;
                    while (lInfo[lastIdx].subLayerIds) {
                        // find last child index of this group. the last child may be a group itself so we keep processing the while loop
                        lastIdx = lInfo[lastIdx].subLayerIds[
                            lInfo[lastIdx].subLayerIds.length - 1];
                    }

                    // lastIdx has made it to the very last child in the original group node.
                    // advance by 1 to get the next sibling index to the group
                    idx = lastIdx + 1;
                } else {
                    // advance to the first child layer
                    idx += 1;
                }
            } else {
                // leaf node

                if (!opts.skip) {
                    // load the features, store promise in array
                    featurePromises.push(loadFeatureAttribs(
                        layer.url + '/' + idx.toString(), opts.attribs, esriBundle));
                }

                // advance the loop
                idx += 1;
            }
        }

        // wait for promises.  add results to result
        Promise.all(featurePromises).then(
            layerDataArray => {
                // attribs are loaded
                // package into final object bundle structure and return
                const result = newLayerBundle(layer.id);
                layerDataArray.forEach(layerData => {
                    result.registerData(layerData);
                });
                resolve(result);
            }
        );
    });
}

function loadLayerAttribsBuilder(esriBundle) {

    /**
    * Fetch attributes from a server-based Layer
    * @param {Object} layer an ESRI API layer object
    * @param {Object} options settings to determine if sub layers or certain attributes should be skipped.
    * @return {Promise} promise of attributes in proper format
    */
    return (layer, options) => {
        /*
        format of the options object
        all parts are optional.  default values are skip: false and attribs: "*"
        {
            "<layerindex a>": {
                "skip": true
            },
             "<layerindex b>": {
                "skip": false,
                "attribs": "field3,field8,field11"
            },
            "<layerindex d>": {
            }
        }
        */

        const shr = shared(esriBundle);
        const lType = shr.getLayerType(layer);
        switch (lType) {
            case 'FeatureLayer':

                return processFeatureLayer(layer, options, esriBundle);

            case 'ArcGISDynamicMapServiceLayer':

                return processDynamicLayer(layer, options, esriBundle);

            // case 'WmsLayer':
            // case 'ArcGISTiledMapServiceLayer':
            default:
                return new Promise((resolve, reject) => {
                    reject('no support for loading attributes from layer type ' + lType);
                });
        }
    };
}

//  Attribute Loader related functions
// TODO consider re-writing all the asynch stuff with the ECMA-7 style of asynch keywords
module.exports = esriBundle => {
    return {
        loadLayerAttribs: loadLayerAttribsBuilder(esriBundle)
    };
};
