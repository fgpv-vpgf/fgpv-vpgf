'use strict';

const wmsFC = require('./wmsFC.js')();
const placeholderFC = require('./placeholderFC.js')();
const layerRecord = require('./layerRecord.js')();
const shared = require('./shared.js')();

/**
 * @class WmsRecord
 */
class WmsRecord extends layerRecord.LayerRecord {

    /**
     * Create a layer record with the appropriate geoApi layer type.  Layer config
     * should be fully merged with all layer options defined (i.e. this constructor
     * will not apply any defaults).
     * @param {Object} layerClass    the ESRI api object for wms layers
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

    get layerType () { return shared.clientLayerType.OGC_WMS; }

    makeLayerConfig () {
        const cfg = super.makeLayerConfig();
        cfg.visibleLayers = this.config.layerEntries.map(le => le.id);
        return cfg;
    }

    /**
    * Triggers when the layer loads.
    *
    * @function onLoad
    */
    onLoad () {
        const loadPromises = super.onLoad();

        const fc = new wmsFC.WmsFC(this, '0', this.config);
        this._featClasses['0'] = fc;

        loadPromises.push(fc.loadSymbology());

        Promise.all(loadPromises).then(() => {
            this._stateChange(shared.states.LOADED);
        });
    }

    /**
     * Run a getFeatureInfo on a WMS layer, return the result as a promise.  Fills the panelData array on resolution.
     *
     * @param {Object} opts additional argumets like map object, clickEvent, etc.
     * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
     */
    identify (opts) {
        // TODO add full documentation for options parameter

        // TODO consider having a constants area in geoApi / better place for this definition
        const infoMap = {
            'text/html;fgpv=summary': 'HTML',
            'text/html': 'HTML',
            'text/plain': 'Text',
            'application/json': 'EsriFeature'
        };

        // ignore layers with no mime type
        if (!infoMap.hasOwnProperty(this.config.featureInfoMimeType)) {
            // TODO verifiy this is correct result format if layer should be excluded from the identify process
            return { identifyResults: [], identifyPromise: Promise.resolve() };
        }

        const identifyResult = new shared.IdentifyResult(this.getProxy());

        const identifyPromise = this._apiRef.layer.ogc
            .getFeatureInfo(
                this._layer,
                opts.clickEvent,
                this.config.layerEntries.map(le => le.id),
                this.config.featureInfoMimeType)
            .then(data => {
                identifyResult.isLoading = false;

                // TODO: check for French service
                // check if a result is returned by the service. If not, do not add to the array of data
                if (data.indexOf('Search returned no results') === -1 && data !== '') {
                    identifyResult.data.push(data);
                }

                // console.info(data);
            });

        return { identifyResults: [identifyResult], identifyPromise };
    }
}

module.exports = () => ({
    WmsRecord
});
