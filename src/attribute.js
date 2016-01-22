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
        layerIdx: -1 //default value to indicate uninitialized
    };
}

/**
* Will generate an empty object structure to store a bundle of attributes for a full layer
* @private
* @return {Object} empty layer bundle object
*/
function newLayerBundle(layerId) {
    const bundle = {
        layerId, //for easy access to know what layer the results belong to
        indexes: [], //for easy iteration over all indexes in the set
        registerData
    };

    function registerData(layerData) {
        layerData.layerId = bundle.layerId;
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
    let offset = layerData.features.length;

    //add new data to layer data's array
    layerData.features = layerData.features.concat(featureData);

    //make parent pointers and a fun index on object id
    featureData.forEach((elem, idx) => {
        //map object id to index of object in feature array
        //use toString, as objectid is integer and will act funny using array notation.
        layerData.oidIndex[elem.attributes[layerData.oidField].toString()] = idx + offset;

        //pointer back to parent
        //TODO verify we still have use for the parent pointer
        elem.parent = layerData;
    });
}

//skim the last number off the Url
//TODO apply more edge case tests to this function
function getLayerIndex(layerUrl) {
    let endIdx = layerUrl.length;
    let idx;

    //handle case if a trailing slash
    if (layerUrl.substr(endIdx - 1) === '/') {
        endIdx -= 1;
    }

    idx = layerUrl.lastIndexOf('/', endIdx - 1);

    return parseInt(layerUrl.substring(idx + 1, endIdx), 10);

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
    // fetch attributes from feature layer. where specifies records with id's higher than stuff already
    // downloaded. no geometry.
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
                    //this is our first batch and our server is 10.0.  set the max batch size to this batch size
                    maxBatch = len;
                }

                if (len < maxBatch) {
                    //this batch is less than the max.  this is last batch.  no need to query again.
                    callerDef.resolve(dataResult.features);
                } else {
                    //stash the result and call the service again for the next batch of data.
                    //max id becomes last object id in the current batch
                    const thisDef = new esriBundle.Deferred();
                    loadDataBatch(dataResult.features[len - 1].attributes[idField], maxBatch,
                        layerUrl, idField, attribs, thisDef);

                    thisDef.then(dataArray => {
                        callerDef.resolve(dataResult.features.concat(dataArray));
                    },

                    error => {
                        callerDef.reject(error);
                    });
                }
            } else {
                //no more data.  we are done
                callerDef.resolve([]);
            }
        } else {
            //it is possible to have an error, but it comes back on the "success" channel.
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
* @return {Promise} promise of attributes in proper format
*/
function loadFeatureAttribs(layerUrl, attribs, esriBundle) {

    return new Promise((resolve, reject) => {

        //extract info for this service
        const defService = esriBundle.esriRequest({
            url: layerUrl,
            content: { f: 'json' },
            callbackParamName: 'callback',
            handleAs: 'json',
        });

        defService.then(serviceResult => {
            if (serviceResult && (typeof serviceResult.error === 'undefined')) {

                //set up layer data object based on layer data
                //10.0 server will not supply a max record value
                let maxBatchSize = serviceResult.maxRecordCount || -1;

                //TODO should we stick with dojo deferred inside here, or switch to native Promise?
                const defFinished = new esriBundle.Deferred();
                const layerData = newLayerData();

                layerData.layerIdx = getLayerIndex(layerUrl);

                //find object id field
                //NOTE cannot use arrow functions here due to bug
                serviceResult.fields.every(function (elem) {
                    if (elem.type === 'esriFieldTypeOID') {
                        layerData.oidField = elem.name;
                        return false; //break the loop
                    }

                    return true; //keep looping
                });

                //ensure our attribute list contains the object id
                if (attribs !== '*') {
                    if (attribs.indexOf(layerData.oidField) === -1) {
                        attribs += (',' + layerData.oidField);
                    }
                }

                //begin the loading process
                loadDataBatch(-1, maxBatchSize, layerUrl, layerData.oidField,
                    attribs, defFinished);

                //after all data has been loaded
                defFinished.promise.then(features => {
                    addLayerData(layerData, features);

                    //return the data as part of the promise
                    resolve(layerData);
                },

                error => {
                    console.warn('error getting attribute data for ' + layerUrl);

                    //return the error as part of the promise
                    reject(error);
                });
            } else {
                //case where error happened but service request was successful
                console.warn('Service metadata load error');
                if (serviceResult && serviceResult.error) {
                    //return the error as part of the promise
                    reject(serviceResult.error);
                } else {
                    reject(new Error('Unknown error loading service metadata'));
                }
            }
        }, error => {
            //return the error as part of the promise
            console.warn('Service metadata load error : ' + error);
            reject(error);
        });
    });
}

//extract the options (including defaults) for a layer index
function pluckOptions(layerIdx, options) {
    //default values
    const opts = {
        skip: false,
        attribs: '*'
    };

    //check if real options exist.  if so, replace defaults with real values
    if (options && options[layerIdx]) {
        if (options[layerIdx].skip) {
            opts.skip = true;
        }
        if (options[layerIdx].attribs) {
            opts.attribs = options[layerIdx].attribs;
        }
    }
    return opts;
}

/**
* Ochestrate the attribute extraction of a feature layer object.
* @private
* @param  {Object} layer an ESRI API Feature layer object
* @param  {Object} options information on layer and attribute skipping
* @param  {Object} esriBundle bundle of API classes
* @return {Promise} promise of attributes in proper format
*/
function processFeatureLayer(layer, options, esriBundle) {

    //logic is in separate function to passify the cyclomatic complexity check.
    //TODO file based layers will not have URL.  will need additional logic to extract attributes from layer feature collection
    //TODO we may want to support the option of a layer that points to a server based JSON file containing attributes

    return new Promise((resolve, reject) => {
        const idx = getLayerIndex(layer.url);
        const opts = pluckOptions(idx, options);
        const result = newLayerBundle(layer.id);

        //check for skip flag
        if (opts.skip) {
            resolve(result);
        } else {
            //call loadFeatureAttribs with options if present
            loadFeatureAttribs(layer.url, opts.attribs, esriBundle).then(
                layerData => {
                    //attribs are loaded
                    //package into final object structure (one instance) and return
                    result.registerData(layerData);
                    resolve(result);
                }
            ).catch(

                //TODO is this redundant? if we don't add the catch will the rejection bubble on its own?
                error => {
                    //issue loading attribs
                    reject(error);
                }
            );
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

    //logic is in separate function to passify the cyclomatic complexity check.
    //TODO we may want to support the option of a layer that points to a server based JSON file containing attributes
    return new Promise((resolve, reject) => {
        let idx = 0;
        let opts;
        const featurePromises = [];

        //for each layer leaf.  we use a custom loop as we need to skip sections
        while (idx < layer.layerInfos.length) {

            opts = pluckOptions(idx, options);

            // check if leaf node or group node
            if (layer.layerInfos[idx].subLayerIds) {
                //group node

                if (opts.skip) {
                    //skip to 1 past last child layer (thus avoiding processing all children)
                    idx = layer.layerInfos[idx].subLayerIds[
                        layer.layerInfos[idx].subLayerIds.length - 1] + 1;
                } else {
                    //advance to the first child layer
                    idx += 1;
                }
            } else {
                //leaf node

                if (!opts.skip) {
                    //load the features, store promise in array
                    featurePromises.push(loadFeatureAttribs(
                        layer.url + '/' + idx.toString(), opts.attribs, esriBundle));
                }

                //advance the loop
                idx += 1;
            }
        }

        //wait for promises.  add results to result
        Promise.all(featurePromises).then(
            layerDataArray => {
                //attribs are loaded
                //package into final object bundle structure and return
                const result = newLayerBundle(layer.id);
                layerDataArray.forEach(layerData => {
                    result.registerData(layerData);
                });
                resolve(result);
            }
        ).catch(
            error => {
                //TODO is this redundant? if we don't add the catch will the rejection bubble on its own?
                //issue loading attribs
                reject(error);
            }
        );
    });
}

function loadLayerAttribsBuilder(esriBundle) {

    /**
    * fetch attributes from a server-based Layer
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

            //case 'WmsLayer':
            //case 'ArcGISTiledMapServiceLayer':
            default:
                return new Promise((resolve, reject) => {
                    reject('no support for loading attributes from layer type ' + lType);
                });
        }
    };
}

// Attribute Loader related functions
//TODO consider re-writing all the asynch stuff with the ECMA-7 style of asynch keywords
module.exports = esriBundle => {
    return {
        loadLayerAttribs: loadLayerAttribsBuilder(esriBundle)
    };
};
