'use strict';

const shared = require('./shared.js')();
const layerRecord = require('./layerRecord.js')();
const attribFC = require('./attribFC.js')();

/**
 * @class AttribRecord
 */
class AttribRecord extends layerRecord.LayerRecord {
    // this class has functions common to layers that have attributes

    get clickTolerance () { return this._tolerance; }

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
        this._tolerance = this.config.tolerance;
        this._filterEvent = new shared.FakeEvent();
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

    /**
     * Test if an attribute field has a date data type.
     *
     * @param {String} attribName     the attribute name to check if it's a date field
     * @return {Promise}              resolves with a boolean indicating if attrib name is a date field.
     */
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

    /**
    * Extract the feature name from a feature as best we can.
    *
    * @function getFeatureName
    * @param {String} objId      the object id of the attribute
    * @param {Object} attribs    the dictionary of attributes for the feature.
    * @returns {String}          the name of the feature
    */
    getFeatureName (objId, attribs) {
        return this._featClasses[this._defaultFC].getFeatureName(objId, attribs);
    }

    /**
    * Extract the tooltip field from a feature as best we can.
    *
    * @function getTooltipName
    * @param {String} objId      the object id of the attribute
    * @param {Object} attribs    the dictionary of attributes for the feature.
    * @returns {String}          the name of the feature
    */
   getTooltipName (objId, attribs) {
    return this._featClasses[this._defaultFC].getTooltipName(objId, attribs);
}

    /**
     * Fetches a graphic for the given object id.
     * Will attempt local copy (unless overridden), will hit the server if not available.
     *
     * @function fetchGraphic
     * @param  {Integer} objId         ID of object being searched for
     * @param {Object} opts            object containing option parametrs
     *                 - map           map wrapper object of current map. only required if requesting geometry
     *                 - geom          boolean. indicates if return value should have geometry included. default to false
     *                 - attribs       boolean. indicates if return value should have attributes included. default to false
     * @returns {Promise} resolves with a bundle of information. .graphic is the graphic; .layerFC for convenience
     */
    fetchGraphic (objId, opts) {
        return this._featClasses[this._defaultFC].fetchGraphic(objId, opts);
    }

    /**
     * Will attempt to zoom the map view so the a graphic is prominent.
     *
     * @function zoomToGraphic
     * @param  {Integer} objId          Object ID of grahpic being searched for
     * @param  {Object} map             wrapper object for the map we want to zoom
     * @param {Object} offsetFraction   an object with decimal properties `x` and `y` indicating percentage of offsetting on each axis
     * @return {Promise}                resolves after the map is done moving
     */
    zoomToGraphic (objId, map, offsetFraction) {
        return this._featClasses[this._defaultFC].zoomToGraphic(objId, map, offsetFraction);
    }

    /**
     * Applies the current filter settings to the physical map layer.
     *
     * @function applyFilterToLayer
     * @param {Array} [exclusions] list of any filters to exclude from the result. omission includes all keys
     */
    applyFilterToLayer (exclusions = []) {
        this._featClasses[this._defaultFC].applyFilterToLayer(exclusions);
    }

    /**
     * Get feature count of a feature layer.
     *
     * @function getFeatureCount
     * @param {String} url     server url of the feature layer. empty string for file based layers
     * @return {Promise}       resolves with an integer indicating the feature count. -1 if error occured.
     */
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
        // ignore any functions hanging around on the attribute.
        if (fields) {
            attribs = attribFC.AttribFC.unAliasAttribs(attribs, fields);
        }
        return Object.keys(attribs)
            .filter(key => typeof attribs[key] !== 'function')
            .map(key => {
                const fieldType = fields ? fields.find(f => f.name === key) : null;
                return {
                    key: attribFC.AttribFC.aliasedFieldNameDirect(key, fields), // need synchronous variant of alias lookup
                    value: attribs[key],
                    field: key,
                    type: fieldType ? fieldType.type : fieldType
                };
            });
    }

    /**
     * Wire up filter listener.
     *
     * @function addFilterListener
     * @param {Function} listenerCallback function to call when a filter event happens
     */
    addFilterListener (listenerCallback) {
        return this._filterEvent.addListener(listenerCallback);
    }

    /**
     * Remove a filter listener.
     *
     * @function removeFilterListener
     * @param {Function} listenerCallback function to not call when a filter event happens
     */
    removeFilterListener (listenerCallback) {
        this._filterEvent.removeListener(listenerCallback);
    }

    /**
     * Trigger a filter event.
     *
     * @function raiseFilterEvent
     * @param {String} layerID id for layer (record) who raised the filter.
     * @param {String} layerIdx index of the FC for who raised the filter.
     * @param {String} filterType indicates what kind of filter was changed. see shared.filterType enum for valid values
     */
    raiseFilterEvent (layerID, layerIdx, filterType) {
        this._filterEvent.fireEvent({
            layerID,
            layerIdx,
            filterType
        });
    }
}

module.exports = () => ({
    AttribRecord
});
