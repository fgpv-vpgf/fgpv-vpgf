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

        if (config.suppressGetCapabilities) {
            this.onLoad();
        }
    }

    get layerType () { return shared.clientLayerType.OGC_WMS; }

    /**
     * Creates an options object for the map API object
     *
     * @function makeLayerConfig
     * @returns {Object} an object with api options
     */
    makeLayerConfig () {
        const cfg = super.makeLayerConfig();
        cfg.visibleLayers = this.config.layerEntries.map(le => le.id);

        const styles = this.config.layerEntries.map(e => e.currentStyle).join();

        cfg.customLayerParameters = {
            styles: styles
        };

        if (this.config.suppressGetCapabilities) {
            cfg.resourceInfo = {
                extent: new this._apiRef.Map.Extent(-141, 41, -52, 83.5, {wkid: 4326}), // TODO make this a parameter post-demo
                layerInfos: this.config.layerEntries
                    .map(le => new this._apiRef.layer.WMSLayerInfo({name: le.id, title: le.name || ''}))
            };
        }

        return cfg;
    }

    /**
     * Add a WMS layer parameter, maybe even refresh the layer
     * 
     * @function setCustomParameter
     * @param {String} key name of the key to be created or updated
     * @param {String} value value of the key
     * @param {Boolean} forceRefresh show the new fancy version of the layer or not
     */
    setCustomParameter(key, value, forceRefresh=true) {
        this._layer.customLayerParameters[key] = value;
        if (forceRefresh) {
            this._layer.refresh();
        }
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
     * Run a getFeatureInfo on a WMS layer, return the result as a promise.
     * Options:
     * - clickEvent {Object} an event object from the mouse click event, where the user wants to identify.
     *
     * @param {Object} opts     additional arguemets, see above.
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

        // ignore layers with no mime type, not loaded, not visible, not queryable
        if (this.state === shared.states.ERROR ||
            this.state === shared.states.LOADING ||
            this.state === shared.states.NEW ||
            !this.visibility ||
            !this.isQueryable() ||
            !infoMap.hasOwnProperty(this.config.featureInfoMimeType)) {
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
                if (data) {
                    if (typeof data !== 'string') {
                        // likely json or an image
                        identifyResult.data.push(data);
                    } else if (data.indexOf('Search returned no results') === -1 && data !== '') {
                        identifyResult.data.push(data);
                    } 
                }

                // console.info(data);
            });

        return { identifyResults: [identifyResult], identifyPromise };
    }

    /**
     * Indicates the layer is WMS based.
     *
     * @function dataSource
     * @returns {String} 'wms' since WMS based layer
     */
    dataSource () {
        return shared.dataSources.WMS;
    }
}

module.exports = () => ({
    WmsRecord
});
