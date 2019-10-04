'use strict';

const basicFC = require('./basicFC.js')();
const placeholderFC = require('./placeholderFC.js')();
const layerRecord = require('./layerRecord.js')();
const shared = require('./shared.js')();

/**
 * @class TileRecord
 */
class TileRecord extends layerRecord.LayerRecord {

    /**
     * Create a layer record with the appropriate geoApi layer type.  Layer config
     * should be fully merged with all layer options defined (i.e. this constructor
     * will not apply any defaults).
     * @param {Object} layerClass    the ESRI api object for tile layers
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

    /**
    * Triggers when the layer loads.
    *
    * @function onLoad
    */
    onLoad () {
        const loadPromises = super.onLoad();

        const fc = new basicFC.BasicFC(this, '0', this.config);
        this._featClasses['0'] = fc;

        loadPromises.push(fc.loadSymbology(true));

        Promise.all(loadPromises).then(() => {
            this._stateChange(shared.states.LOADED);
        });
    }

    get layerType () { return shared.clientLayerType.ESRI_TILE; }

}

module.exports = () => ({
    TileRecord
});
