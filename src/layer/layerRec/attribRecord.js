'use strict';

const layerRecord = require('./layerRecord.js')();
const attribFC = require('./attribFC.js')();

/**
 * @class AttribRecord
 */
class AttribRecord extends layerRecord.LayerRecord {
    // this class has functions common to layers that have attributes

    // FIXME clickTolerance is not specific to AttribRecord but rather Feature and Dynamic
    get clickTolerance () { return this.config.tolerance; }

    /**
     * Create a layer record with the appropriate geoApi layer type.  Layer config
     * should be fully merged with all layer options defined (i.e. this constructor
     * will not apply any defaults).
     * @param {Object} layerClass    the ESRI api object for the layer
     * @param {Object} esriRequest   the ESRI api object for making web requests with proxy support
     * @param {Object} apiRef        object pointing to the geoApi. allows us to call other geoApi functions.
     * @param {Object} config        layer config values
     * @param {Object} esriLayer     an optional pre-constructed layer
     * @param {Function} epsgLookup  an optional lookup function for EPSG codes (see geoService for signature)
     */
    constructor (layerClass, esriRequest, apiRef, config, esriLayer, epsgLookup) {
        super(layerClass, apiRef, config, esriLayer, epsgLookup);

        this._esriRequest = esriRequest;
    }

    /**
     * Get the best user-friendly name of a field. Uses alias if alias is defined, else uses the system attribute name.
     *
     * @param {String} attribName     the attribute name we want a nice name for
     * @return {Promise}              resolves to the best available user friendly attribute name
     */
    aliasedFieldName (attribName) {
        return this._featClasses[this._defaultFC].aliasedFieldName(attribName);
    }

    /**
     * Retrieves attributes from a layer for a specified feature index
     * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
     */
    getFormattedAttributes () {
        return this._featClasses[this._defaultFC].getFormattedAttributes();
    }

    checkDateType (attribName) {
        return this._featClasses[this._defaultFC].checkDateType(attribName);
    }

    /**
    * Returns attribute data for this layer.
    *
    * @function getAttribs
    * @returns {Promise}         resolves with a layer attribute data object
    */
    getAttribs () {
        return this._featClasses[this._defaultFC].getAttribs();
    }

    /**
    * Returns layer-specific data for this Record
    *
    * @function getLayerData
    * @returns {Promise}         resolves with a layer data object
    */
    getLayerData () {
        return this._featClasses[this._defaultFC].getLayerData();
    }

    getFeatureName (objId, attribs) {
        return this._featClasses[this._defaultFC].getFeatureName(objId, attribs);
    }

    fetchGraphic (objId) {
        return this._featClasses[this._defaultFC].fetchGraphic(objId);
    }

    getFeatureCount (url) {
        if (url) {
            // wrapping server call in a function, as we regularly encounter sillyness
            // where we need to execute the count request twice.
            // having a function (with finalTry flag) lets us handle the double-request
            const esriServerCount = (layerUrl, finalTry = false) => {
                // extract info for this service
                const defService = this._esriRequest({
                    url: `${layerUrl}/query`,
                    content: {
                        f: 'json',
                        where: '1=1',
                        returnCountOnly: true,
                        returnGeometry: false
                    },
                    callbackParamName: 'callback',
                    handleAs: 'json',
                });

                return new Promise(resolve => {
                    defService.then(serviceResult => {
                        if (serviceResult && (typeof serviceResult.error === 'undefined') &&
                            (typeof serviceResult.count !== 'undefined')) {
                            // we got a row count
                            resolve(serviceResult.count);
                        } else if (!finalTry) {
                            // do a second attempt
                            resolve(esriServerCount(layerUrl, true));
                        } else {
                            // tells the app it failed
                            resolve(-1);
                        }
                    }, error => {
                        // failed to load service info.
                        // TODO any tricks to avoid duplicating the error case in both blocks?
                        if (!finalTry) {
                            // do a second attempt
                            resolve(esriServerCount(layerUrl, true));
                        } else {
                            // tells the app it failed
                            console.warn(error);
                            resolve(-1);
                        }
                    });
                });
            };

            return esriServerCount(url);

        } else {
            // file based layer.  count local features
            return Promise.resolve(this._layer.graphics.length);
        }
    }

    /**
     * Transforms esri key-value attribute object into key value array with format suitable
     * for consumption by the details pane.
     *
     * @param  {Object} attribs      attribute key-value mapping, potentially with aliases as keys
     * @param  {Array} fields        optional. fields definition array for layer. no aliasing done if not provided
     * @return {Array}               attribute data transformed into a list, with potential field aliasing applied
     */
    attributesToDetails (attribs, fields) {
        // TODO make this extensible / modifiable / configurable to allow different details looks for different data
        // simple array of text mapping for demonstration purposes. fancy grid formatting later?
        return Object.keys(attribs)
            .map(key => {
                const fieldType = fields ? fields.find(f => f.name === key) : null;
                return {
                    key: attribFC.AttribFC.aliasedFieldNameDirect(key, fields), // need synchronous variant of alias lookup
                    value: attribs[key],
                    type: fieldType ? fieldType.type : fieldType
                };
            });
    }
}

module.exports = () => ({
    AttribRecord
});
