(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name LayerBlueprint
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `LayerBlueprint` service returns `LayerBlueprint` class which abstracts common elements of layer creating (either from file or online servcie).
     *
     */
    /**
      * @ngdoc service
      * @name LayerServiceBlueprint
      * @module app.geo
      * @requires dependencies
      * @description
      *
      * The `LayerServiceBlueprint` service returns `LayerServiceBlueprint` class to be used when creating layers from online services (supplied by config, RCS or user added).
      *
      */
    /**
       * @ngdoc service
       * @name LayerFileBlueprint
       * @module app.geo
       * @requires dependencies
       * @description
       *
       * The `LayerFileBlueprint` service returns `LayerFileBlueprint` class to be used when creating layers from user-supplied files.
       *
       */
    angular
        .module('app.geo')
        .factory('LayerBlueprint', LayerBlueprint)
        .factory('LayerServiceBlueprint', LayerServiceBlueprint);

    // TODO: add
    // .factory('LayerFileBlueprint', LayerFileBlueprint);

    function LayerBlueprint(layerDefaults) {
        let idCounter = 0; // layer counter for generating layer ids

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        class LayerBlueprint {
            /**
             * Creates a new LayerBlueprint.
             * @param  {Object} initialConfig partial config, can be an empty object.
             */
            constructor(initialConfig) {
                this.initialConfig = {};
                this.config = {};

                if (typeof initialConfig !== 'undefined') {
                    this.initialConfig = initialConfig;
                    this.config = angular.merge({}, initialConfig);
                }

                this._applyDefaults();
            }

            /**
             * Applies layer defaults based on the layer type.
             */
            _applyDefaults() {
                const defaults = layerDefaults[this.config.layerType];

                // TODO: add defautls for wms and dynamic layerEntries
                // this is mostly useless right now since we apply defaults in `legend-entry` service
                this.config.options = angular.merge({}, defaults.options, this.config.options);
                this.config.flags = angular.merge({}, defaults.flags, this.config.flags);
            }

            /**
             * Returns layer type or null if not set of the blueprint.
             * @return {String|null} layer type as String or null
             */
            get layerType() {
                return (typeof this.config.layerType !== 'undefined') ? this.config.layerType : null;
            }

            /**
             * Sets layer type.
             * @param  {String} value layer type as String
             */
            set layerType(value) {
                // apply config defaults when setting layer type
                // TODO: this can be invoked only once right now.
                if (typeof this.config.layerType !== 'undefined') {
                    this.config.layerType = value;
                    this._applyDefaults();
                }
            }

            /**
             * Generates a layer object. This is a stub function to be fully implemented by subcalasses.
             * @return {Object} "common config" ? witch contains layer id
             */
            generateLayer() {
                // generate id if missing when generating layer
                if (typeof this.config.id === 'undefined') {
                    this.config.id = `${this.layerType}#${idCounter++}`;
                }

                // return common config, eh...
                return {
                    id: this.config.id
                };
            }
        }
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        return LayerBlueprint;
    }

    function LayerServiceBlueprint(LayerBlueprint, gapiService, layerTypes) {
        // generator functions for different layer types
        const layerServiceGenerators = {
            [layerTypes.esriDynamic]: (config, commonConfig) =>
                new gapiService.gapi.layer.ArcGISDynamicMapServiceLayer(config.url, commonConfig),

            [layerTypes.esriFeature]: (config, commonConfig) => {
                commonConfig.mode = config.snapshot ?
                    gapiService.gapi.layer.FeatureLayer.MODE_SNAPSHOT :
                    gapiService.gapi.layer.FeatureLayer.MODE_ONDEMAND;
                return new gapiService.gapi.layer.FeatureLayer(config.url, commonConfig);
            },

            [layerTypes.esriImage]: (config, commonConfig) =>
                new gapiService.gapi.layer.ArcGISImageServiceLayer(config.url, commonConfig),

            [layerTypes.esriTile]: (config, commonConfig) =>
                new gapiService.gapi.layer.TileLayer(config.url, commonConfig),

            [layerTypes.ogcWms]: (config, commonConfig) => {
                commonConfig.visibleLayers = config.layerEntries.map(le => le.id);
                return new gapiService.gapi.layer.ogc.WmsLayer(config.url, commonConfig);
            }
        };

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        class LayerServiceBlueprint extends LayerBlueprint {
            /**
             * Creates a new LayerServiceBlueprint.
             * @param  {initialConfig} initialConfig partical config, __must__ contain a service `url`.
             */
            constructor(initialConfig) {
                if (typeof initialConfig.url === 'undefined') {
                    // TODO: throw error ?
                    console.error('Service layer needs a url.');
                    return;
                } else {
                    // `replace` strips trailing slashes
                    initialConfig.url = initialConfig.url.replace(/\/+$/, '');
                }

                super(initialConfig);

                // if layerType is no specified, this is likely a user added layer
                // call geoApi to predict its type
                if (this.layerType === null) {
                    return gapiService.gapi.layer.predictLayerUrl(this.config.url)
                        .then(fileInfo => fileInfo.serviceType)
                        .catch(error => console.error('Something happened', error));
                }
            }

            /**
             * Generates a layer from an online service based on the layer type.
             * Takes a layer in the config format and generates an appropriate layer object.
             * @param {object} layerConfig a configuration fragment for a single layer
             * @return {object} a layer object matching one of the esri/layers objects based on the layer type
             */
            generateLayer() {
                const commonConfig = super.generateLayer();

                if (layerServiceGenerators.hasOwnProperty(this.layerType)) {
                    return layerServiceGenerators[this.layerType](this.config, commonConfig);
                } else {
                    throw new Error('The layer type is not supported');
                }
            }
        }
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        return LayerServiceBlueprint;
    }
})();
