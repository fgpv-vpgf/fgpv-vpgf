'use strict';

const layerRecord = require('./layerRecord.js')();
const basicFC = require('./basicFC.js')();
const placeholderFC = require('./placeholderFC.js')();
const shared = require('./shared.js')();

/**
 * @class ImageRecord
 */
class ImageRecord extends layerRecord.LayerRecord {
    // NOTE: if we decide to support attributes from ImageServers,
    //       we would extend from AttribRecord instead of LayerRecord
    //       (and do a lot of testing!)

    /**
     * Create a layer record with the appropriate geoApi layer type.  Layer config
     * should be fully merged with all layer options defined (i.e. this constructor
     * will not apply any defaults).
     * @param {Object} layerClass    the ESRI api object for image server layers
     * @param {Object} apiRef        object pointing to the geoApi. allows us to call other geoApi functions.
     * @param {Object} config        layer config values
     * @param {Object} esriLayer     an optional pre-constructed layer
     * @param {Function} epsgLookup  an optional lookup function for EPSG codes (see geoService for signature)
     */
    constructor (layerClass, apiRef, config, esriLayer, epsgLookup) {
        super(layerClass, apiRef, config, esriLayer, epsgLookup);

        // handles placeholder symbol, possibly other things
        this._defaultFC = '0';
        this._featClasses['0'] = new placeholderFC.PlaceholderFC(this, this.name);
    }

    get layerType () { return shared.clientLayerType.ESRI_IMAGE; }

    /**
    * Triggers when the layer loads.
    *
    * @function onLoad
    */
    onLoad () {
        const loadPromises = super.onLoad();

        const fc = new basicFC.BasicFC(this, '0', this.config);
        this._featClasses['0'] = fc;

        loadPromises.push(fc.loadSymbology());

        Promise.all(loadPromises).then(() => {
            this._stateChange(shared.states.LOADED);
        });
    }
}

module.exports = () => ({
    ImageRecord
});
