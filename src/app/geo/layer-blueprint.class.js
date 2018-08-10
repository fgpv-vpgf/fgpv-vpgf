/**
 * @module LayerBlueprintFactory
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * The `LayerBlueprint` service returns `LayerBlueprint` class which abstracts common elements of layer creating (either from file or online servcie).
 * The `LayerServiceBlueprint` service returns `LayerServiceBlueprint` class to be used when creating layers from online services (supplied by config, RCS or user added).
 * The `LayerFileBlueprint` service returns `LayerFileBlueprint` class to be used when creating layers from user-supplied files.
 *
 */
angular
    .module('app.geo')
    .factory('LayerBlueprint', LayerBlueprintFactory);

function LayerBlueprintFactory(common, gapiService, Geo, ConfigObject, configService, bookmarkService, appInfo,
    layerSource, LayerSourceInfo) {

    let idCounter = 0; // layer counter for generating layer ids

    // destructure Geo into `layerTypes` and `serviceTypes`
    const { Layer: { Types: layerTypes }, Service: { Types: serviceTypes } } = Geo;

    class LayerBlueprint {

        /**
         *
         * @param {string} url the URL of the layer endpoint, optional
         */
        constructor(url) {
            // if ESRI JSAPI fixes it's CORS bug this can be removed
            configService.getSync.map.instance.checkCorsException(url);
        }

        // no validation required for services. mock a vlidation process for consistency.
        // only instances of LayerFileBlueprint required validation; that class overrides this function
        validateLayerSource() {
            return common.$q.resolve();
        }

        set config(value) {
            if (this._config) {
                console.warn('config is already set');
                return;
            }

            // check if there is a parsed and stored bookmark for this layer and apply if any
            if (bookmarkService.storedBookmark) {
                const bookmarkedLayer = bookmarkService.storedBookmark.bookmarkLayers.find(layer =>
                    layer.id === value.id);

                if (bookmarkedLayer) {
                    value.applyBookmark(bookmarkedLayer);
                }
            }

            this._config = value;
        }
        get config() { return this._config; }

        /**
         * @returns {Object} layer node source config object with applied defaults
         */
        get source() { return this._source; }
        set source(value) {
            if (this._source) {
                console.warn('source is already set');
                return;
            }

            this._source = value;
            this.config = new LayerBlueprint.LAYER_TYPE_TO_LAYER_NODE[this._source.layerType](this._source);
        }

        /**
         * Sets layer type.
         * @param  {String} value layer type as String
         */
        set layerType(value) {
            // apply config defaults when setting layer type
            this.config.layerType = value;
            this._applyDefaults();

            // generate id if missing when generating layer
            if (typeof this.config.id === 'undefined') {
                this.config.id = `${this.layerType}#${idCounter++}`;
            }
        }

        /**
         * Generates a layer object. This is a stub function to be fully implemented by subcalasses.
         * @return {Object} "common config" ? witch contains layer id
         */
        generateLayer() {
            throw new Error('Call generateLayer on a subclass instead.');
        }

        static get LAYER_TYPE_TO_LAYER_NODE() {
            return {
                [layerTypes.ESRI_TILE]: ConfigObject.layers.BasicLayerNode,
                [layerTypes.ESRI_FEATURE]: ConfigObject.layers.FeatureLayerNode,
                [layerTypes.ESRI_IMAGE]: ConfigObject.layers.BasicLayerNode,
                [layerTypes.ESRI_DYNAMIC]: ConfigObject.layers.DynamicLayerNode,
                [layerTypes.OGC_WMS]: ConfigObject.layers.WMSLayerNode,
                [layerTypes.OGC_WFS]: ConfigObject.layers.WFSLayerNode
            }
        }

        static get LAYER_TYPE_TO_LAYER_RECORD() {
            const gapiLayer = gapiService.gapi.layer;

            return {
                [layerTypes.ESRI_TILE]: gapiLayer.createTileRecord,
                [layerTypes.ESRI_FEATURE]: gapiLayer.createFeatureRecord,
                [layerTypes.ESRI_IMAGE]: gapiLayer.createImageRecord,
                [layerTypes.ESRI_DYNAMIC]: gapiLayer.createDynamicRecord,
                [layerTypes.OGC_WMS]: gapiLayer.createWmsRecord,
                [layerTypes.OGC_WFS]: gapiLayer.createWfsRecord
            }
        }
    }

    class LayerServiceBlueprint extends LayerBlueprint {
        /**
         * Creates a new LayerServiceBlueprint.
         * @param  {Object|LayerSourceInfo} source fully-formed layer config object coming from the config file, or the layerSourceInfo object coming from thel layer loader
         */
        constructor(configFileSource = null, userAddedSource = null) {

            super(configFileSource ? configFileSource.url : userAddedSource.config.url);

            if (configFileSource) {
                this.source = configFileSource; // FYI this sets this.config via setter
            } else if (userAddedSource) {
                this.config = userAddedSource.config;
            }

            return this.validateLayerSource().then(() => this);
        }

        /**
         * Generates a layer from an online service based on the layer type.
         * Takes a layer in the config format and generates an appropriate layer object.
         *
         * @param {Object} layerConfig a configuration fragment for a single layer
         * @return {Object} a LayerRecord object matching one of the esri/layers objects based on the layer type
         */
        generateLayer() {
            const epsg = appInfo.plugins.find(x => x.intention === 'epsg');
            return common.$q.resolve(LayerBlueprint.LAYER_TYPE_TO_LAYER_RECORD[this.config.layerType](
                this.config, undefined, epsg.lookup));
        }
    }

    /**
     * Create a LayerFileBlueprint.
     * Retrieves data from the file. The file can be either online or local.
     * @param  {Function} epsgLookup a function which takes and EPSG code and returns a projection definition (see geoService for the exact signature)
     * @param  {Number} targetWkid wkid of the current map object
     * @param  {String} path      either file name or file url; if it's a file name, need to provide a HTML5 file object
     * @param  {File} file      optional: HTML5 file object
     * @return {Function} progressCallback        optional: function to call on progress events druing when reading file
     * @return {String}           service type: 'csv', 'shapefile', 'geojson'
     */
    class LayerFileBlueprint extends LayerBlueprint {
        constructor(configFileSource = null, userAddedSource = null) {

            super(configFileSource ? configFileSource.url : null);

            // WFS HACK
            // a flag to track wfs case. false for most
            this.wfsConfig = false;

            if (configFileSource) {
                // this flag tells another part of code that things are squirrely and it needs to be aware of the below promise.
                // once things are unsquirreled, the flag will be set back to true and things behave normal
                this.wfsConfig = true;
                this.source = configFileSource;

                // TODO we want to move this promise to the generateLayer function.
                //      that way when we reload, we trigger the loading again.
                // we can't have server hits in the blueprint constructor. it blocks blueprint creation long enough to cause race conditions
                this._configSourceDelayedServer = layerSource.fetchServiceInfo(configFileSource.url, configFileSource.layerType)
                    .then(({ options: layerSourceOptions, preselectedIndex }) => {
                        this._layerSourceOptions = layerSourceOptions;
                        this._layerSource = layerSourceOptions[preselectedIndex];

                        // even though we did a bit of this below on the main thread, do it again, as .fetchServiceInfo
                        // will obliterate some objects.
                        this._layerSource.config._id = configFileSource.id;     // need to change id manually since id given is auto-generated from file logic
                        if (configFileSource.colour) {
                            this._layerSource.colour = configFileSource.colour; // need to also change colour manually, if provided, since colour is also auto-generated
                        }
                        if (!configFileSource.name) {
                            this.config.name = this._layerSource.config.name;
                        }

                        return this._layerSource.validate().then(() => this.validateLayerSource());
                    });

                // set up basic stuff
                // TODO this needs to be refactored badly. doing things this way to get CCCS working
                // TODO this will break loading files on servers from the config.  fix later.

                // fake layer source
                // TODO fix hardcoded WKID (if required). or ideally this just disappears with a proper WFS solution
                this._layerSource = new LayerSourceInfo.WMSServiceInfo(configFileSource, null, 3978);

                // above object obliterates colour, re-apply
                if (configFileSource.colour) {
                    this._layerSource.colour = configFileSource.colour; // need to also change colour manually, if provided, since colour is also auto-generated
                }

                return Promise.resolve(this);

            } else if (userAddedSource) {
                this._layerSource = userAddedSource;
                this.config = this._layerSource.config;
                return this.validateLayerSource().then(() => this);
            }
        }

        validateLayerSource() {
            // clone data because the makeSomethingLayer functions mangle the config data
            const formattedDataCopy = angular.copy(this._layerSource.formattedData);

            // TODO: find a better place for it
            const epsg = appInfo.plugins.find(x => x.intention === 'epsg');
            this._layerSource.epsgLookup = epsg.lookup;

            const layerFileGenerators = {
                [Geo.Service.Types.CSV]: () =>
                    gapiService.gapi.layer.makeCsvLayer(formattedDataCopy, this._layerSource),
                [Geo.Service.Types.GeoJSON]: () =>
                    gapiService.gapi.layer.makeGeoJsonLayer(formattedDataCopy, this._layerSource),
                [Geo.Service.Types.Shapefile]: () =>
                    gapiService.gapi.layer.makeShapeLayer(formattedDataCopy, this._layerSource)
            };

            const layerPromise = layerFileGenerators[this._layerSource.type]();

            layerPromise.then(layer =>
                (this.__layer__ = layer));

            return layerPromise;
        }

        /**
         * Generate actual esri layer object from the file data, config and user options. Wrapped in LayerRecord object.
         * @return {Object} the geoApi layer record object
         */
        generateLayer() {
            // WFS HACK
            const epsg = appInfo.plugins.find(x => x.intention === 'epsg');

            this.config.wfsConfig = this.wfsConfig; // tell the geoApi if this is a wfs loading from a confg (i.e. not the wizard).
            const layerRecord =  LayerBlueprint.LAYER_TYPE_TO_LAYER_RECORD[this.config.layerType](this.config, null, epsg.lookup);

            if (this.wfsConfig) {
                // we need to wait for the data to finish loading.  when it does, we have to hot-swap the esri layer thats inside
                // our layerRecord
                this._configSourceDelayedServer.then(() => layerRecord.updateWfsSource(this.__layer__));
            }

            return common.$q.resolve(layerRecord);
        }
    }

    const service = {
        buildLayer: layerSource => {
            if (layerSource.type && _isFile(layerSource)) {   // file or WFS added through importer
                return new LayerFileBlueprint(null, layerSource);
            } else if (layerSource.config) {                            // service added through importer
                return new LayerServiceBlueprint(null, layerSource);
            } else {                                                    // any file / service added through config
                switch (layerSource.layerType) {
                    case Geo.Layer.Types.OGC_WFS:
                        layerSource.type = Geo.Service.Types.GeoJSON;
                        return new LayerFileBlueprint(layerSource);
                    case Geo.Layer.Types.ESRI_GRAPHICS:
                    case Geo.Layer.Types.ESRI_DYNAMIC:
                    case Geo.Layer.Types.ESRI_IMAGE:
                    case Geo.Layer.Types.ESRI_TILE:
                    case Geo.Layer.Types.OGC_WMS:
                    case Geo.Layer.Types.ESRI_FEATURE:  // may need to split this into two, one for services and one for files
                        return new LayerServiceBlueprint(layerSource);
                    default:
                        return new LayerFileBlueprint(layerSource);
                }
            }
        }
    };

    /**
     * Checks if the layer being added is a file layer
     * @function _isFile
     * @private
     * @param {String} source a string representing the type of layer being added
     * @return {Boolean} true if the layer type matches one of the file layer constants
     */
    function _isFile(source) {
        const fileTypes = [Geo.Service.Types.CSV, Geo.Service.Types.GeoJSON, Geo.Service.Types.Shapefile];
        if (source.layerType && source.layerType === 'ogcWfs'){
            return false;
        }
        return (fileTypes.indexOf(source.type) !== -1);
    }

    return service;
}
