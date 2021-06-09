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

        if (config.suppressGetCapabilities || this.config.url.toLowerCase().indexOf('layers=') !== -1) {
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

        // If suppressGetCapabilities is set to true, or if the URL contains the parameter `layers`,
        // create fake metadata to prevent contacting the server.
        if (this.config.suppressGetCapabilities || this.config.url.toLowerCase().indexOf('layers=') !== -1) {
            // TODO: if the layers provided in the URL parameter `layers` does not match what is provided in layerEntries,
            // display an error.
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

        // If suppressGetCapabilities is set, or the URL contains the `layers` parameter,
        // load the data in a different manner.
        //
        // The `layers` parameter is used specifically for GeoMet WMS, which returns a very
        // large amount of XML data if the parameter is not provided to specify which specific layers
        // should be returned.
        if (this.config.suppressGetCapabilities || this.config.url.toLowerCase().indexOf('layers=') !== -1) {
            // Attempts to retrieve the LegendURL for the layer and updates the symbology afterwards.
            loadPromises.push(
                this.updateCapabilities().then(() => {
                    fc.loadSymbology();
                })
            );
        } else {
            loadPromises.push(fc.loadSymbology());
        }

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
        identifyResult.layerId = this.layerId;
        identifyResult.layerIdx = parseInt(this._defaultFC);

        const identifyPromise = this._apiRef.layer.ogc
            .getFeatureInfo(
                this._layer,
                opts.clickEvent,
                this.config.layerEntries.map(le => le.id),
                this.config.featureInfoMimeType)
            .then((data) => {
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

    /**
     * Fetch and process metadata from WMS endpoint. Constructs a GetCapabilities call using ogc and extracts properties from resulting metadata information.
     *
     * @function updateCapabilities
     * @returns {Promise} a promise that resolves once metadata properties has been processed
     */
    updateCapabilities () {
        let serviceUrl = this.config.url;
        let isGeomet = serviceUrl.toLowerCase().indexOf('/geomet') !== -1;
        let hasLayersParam = serviceUrl.toLowerCase().indexOf('layers=') !== -1;

        // If this service is a GeoMet service and does not currently contain the `layers` parameter,
        // build and add the parameter to the URL.
        // NOTE: This code supports there being multiple parameters provided in layerEntries, but GeoMet does
        // not support this yet.
        if (isGeomet && !hasLayersParam) {
            let layersParam = [];
            this.config.layerEntries.forEach((entry, idx) => {
                layersParam.push(entry.id);
            });

            if (layersParam.length > 0) {
                serviceUrl += '&layers=' + layersParam.join(',');
            }
        }

        // construct a ogc getCapabilities + parseCapabilities() call
        const resPromise = new Promise((resolve, reject) => {
            this._apiRef.layer.ogc.parseCapabilities(serviceUrl).then((data) => {
                this.saveLegendUrls(data.layers);
                resolve();
            });
        });
        return resPromise;
    }

    /**
     * Recursively updates the ESRI layer with the fetched legend URLs returned by getCapabilities.
     *
     * @function saveLegendUrls
     * @param {Array} layers an array of layer objects returned by getCapabilities
     */
    saveLegendUrls (layers) {
        layers.forEach((layer) => {
            // Check to see if this layer belongs to the ESRI `layerInfos` array.
            let layerInfo = this.esriLayer.layerInfos.find((item) => layer.name && item.name === layer.name);

            if (layerInfo) {
                const styles = this.esriLayer.customLayerParameters.styles;

                // Set the legend URL to the style that is currently selected. If none is selected, use the default.
                layerInfo.legendURL = typeof styles !== 'undefined' ? layer.styleToURL[styles] : layer.styleToURL[defaultStyle];
            }

            // Update sublayers if necessary.
            if (layer.layers && layer.layers.length > 0) {
                this.saveLegendUrls(layer.layers);
            }
        });
    }
}

module.exports = () => ({
    WmsRecord
});
