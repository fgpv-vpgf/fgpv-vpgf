(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name layerRegistry
     * @module app.geo
     * @requires
     * @description
     *
     * The `layerRegistry` factory description.
     *
     */
    angular
        .module('app.geo')
        .factory('layerRegistry', layerRegistry);

    function layerRegistry(gapiService, identifyService, layerTypes, configDefaults) {

        const layers = {}; // layer collection
        const legend = []; // legend construct, to be consumed by toc; deflection +2

        const service = {
            legend,
            layers, // TODO: remove raw layer array

            generateLayer,
            registerLayer,
            removeLayer,
            setLayerVisibility
        };

        return service;

        /***/

        /**
         * Sets layer visiblity value.
         * @param {Number} layerId id of the layer in the layer registry
         * @param {String} value   visibility state; Visibility value has four states: 'on', 'off', 'zoomIn', and 'zoomOut'. The first two can be set as initial layer visibility states; the last two are for internal use only. Any value except for 'on' means the layer is hidden. 'off', 'zoomIn', and 'zoomOut' specify an icon and action for the layer toggle.
         * TODO: needs more work for toggling on/off dynamic layers and its children;
         */
        function setLayerVisibility(layerId, value) {
            const l = layers[layerId];

            if (l) {
                l.state.options.visibility.value = value; // update layer state value
                l.layer.setVisibility(value === 'on' ? true : false);
            }
        }

        /**
         * Removes the layer from the map and from the layer registry
         * @param {Number} layerId  the id of the layer to be removed
         * TODO: needs more work for removing dynamic layers and its children;
         */
        function removeLayer(layerId) {
            const l = layers[layerId];

            if (!l) {
                return;
            }

            // map.removeLayer(l.layer);

            // TODO: needs more work to manager layerOrder
            const index = service.legend.indexOf(layerId);
            if (index !== -1) {
                service.legend.splice(index, 1);
            }
        }

        /**
         * Adds a layer object to the layers registry
         * @param {object} layer the API layer object
         * @param {object} initialState a configuration fragment used to generate the layer
         * @param {promise} attribs a promise resolving with the attributes associated with the layer (empty set if no attributes)
         * @param {number} position an optional index indicating at which position the layer was added to the map
         * (if supplied it is the caller's responsibility to make sure the layer is added in the correct location)
         */
        function registerLayer(layer, initialState, attribs, position) {
            // TODO determine the proper docstrings for a non-service function that lives in a service

            if (!layer.id) {
                console.error('Attempt to register layer without id property');
                console.log(layer);
                console.log(initialState);
            }

            if (layers[layer.id]) {
                console.error('attempt to register layer already registered.  id: ' + layer.id);
            }

            const l = {
                layer,
                attribs,

                // apply layer option defaults
                state: angular.merge({}, configDefaults.layerOptions, configDefaults.layerFlags, initialState)
            };

            layers[layer.id] = l;

            if (position === undefined) {
                position = service.legend.length;
            }
            service.legend.splice(position, 0, layer.id);

            // TODO: apply config values
            service.setLayerVisibility(l.layer.id, l.state.options.visibility.value);
        }

        /**
         * Takes a layer in the config format and generates an appropriate layer object.
         * @param {object} layerConfig a configuration fragment for a single layer
         * @return {object} a layer object matching one of the esri/layers objects based on the layer type
         */
        function generateLayer(layerConfig, map) {
            const handlers = {};
            const commonConfig = {
                id: layerConfig.id,
                visible: layerConfig.visibility === 'on',
                opacity: layerConfig.opacity || 1
            };

            handlers[layerTypes.esriDynamic] = config => {
                const l = new gapiService.gapi.layer.ArcGISDynamicMapServiceLayer(config.url, commonConfig);

                identifyService(map, layerRegistry.layers)
                    .addDynamicLayer(l, config.name);
                return l;
            };
            handlers[layerTypes.esriFeature] = config => {
                commonConfig.mode = config.snapshot ?
                    gapiService.gapi.layer.FeatureLayer.MODE_SNAPSHOT :
                    gapiService.gapi.layer.FeatureLayer.MODE_ONDEMAND;
                const l = new gapiService.gapi.layer.FeatureLayer(config.url, commonConfig);

                identifyService(map, layerRegistry.layers)
                    .addFeatureLayer(l, config.name);
                return l;
            };
            handlers[layerTypes.esriImage] = config => {

                // FIXME don't hardcode opacity
                commonConfig.opacity = 0.3;
                return new gapiService.gapi.layer.ArcGISImageServiceLayer(config.url, commonConfig);
            };
            handlers[layerTypes.esriTile] = config => {
                return new gapiService.gapi.layer.TileLayer(config.url, commonConfig);
            };
            handlers[layerTypes.ogcWms] = config => {
                commonConfig.visibleLayers = [config.layerName];
                return new gapiService.gapi.layer.WmsLayer(config.url, commonConfig);
            };

            if (handlers.hasOwnProperty(layerConfig.layerType)) {
                return handlers[layerConfig.layerType](layerConfig);
            } else {
                throw new Error('Your layer type is unacceptable');
            }
        }
    }
})();
