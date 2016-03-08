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

    function layerRegistry(gapiService, layerTypes, configDefaults) {

        const layers = {}; // layer collection
        const legend = []; // legend construct, to be consumed by toc; deflection +2

        const service = {
            legend,
            layers, // TODO: remove raw layer array

            generateLayer,
            registerLayer,
            getFormattedAttributes,
            removeLayer,
            setLayerVisibility,
            aliasedFieldName
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
        function generateLayer(layerConfig) {
            const handlers = {};
            const commonConfig = {
                id: layerConfig.id,
                visible: layerConfig.visibility === 'on',
                opacity: layerConfig.opacity || 1
            };

            handlers[layerTypes.esriDynamic] = config => {
                const l = new gapiService.gapi.layer.ArcGISDynamicMapServiceLayer(config.url, commonConfig);

                return l;
            };
            handlers[layerTypes.esriFeature] = config => {
                commonConfig.mode = config.snapshot ?
                    gapiService.gapi.layer.FeatureLayer.MODE_SNAPSHOT :
                    gapiService.gapi.layer.FeatureLayer.MODE_ONDEMAND;
                const l = new gapiService.gapi.layer.FeatureLayer(config.url, commonConfig);

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

        /**
         * Returns nicely bundled attributes for the layer described by layerId.
         * The bundles are used in the datatable.
         *
         * @param   {String} layerId        The id for the layer
         * @param   {String} featureIndex   The index for the feature (attribute set) within the layer
         * @return  {Promise}               Resolves with the column headers and data to show in the datatable
         */
        function getFormattedAttributes(layerId, featureIndex) {
            // FIXME change to new promise format of attributes.  return a promise from this function.

            if (!layers[layerId]) {
                throw new Error('Cannot get attributes for unregistered layer');
            }

            // waits for attributes to be loaded, then resolves with formatted data
            return layers[layerId].attribs.then(attribBundle => {
                if (!attribBundle[featureIndex] || attribBundle[featureIndex].features.length === 0) {
                    throw new Error('Cannot get attributes for feature set that does not exist');
                }

                // get the attributes and single out the first one
                const attr = attribBundle[featureIndex];
                const first = attr.features[0];

                // columns for the data table
                const columns = [];

                // data for the data table
                const data = [];

                // used to track order of columns
                const columnOrder = [];

                // get the attribute keys to use as column headers
                Object.keys(first.attributes)
                    .forEach((key, index) => {
                        const title = aliasedFieldName(key, attr.fields);

                        columns[index] = {
                            title
                        };
                        columnOrder[index] = key;
                    });

                // get the attribute data from every feature
                attr.features.forEach((feat, index) => {
                    data[index] = [];
                    angular.forEach(feat.attributes, (value, key) => {
                        data[index][columnOrder.indexOf(key)] = value;
                    });
                });

                return {
                    columns,
                    data
                };
            });
        }

        /**
         * Get the best user-friendly name of a field. Uses alias if alias is defined, else uses the system attribute name.
         * @param {String} attribName the attribute name we want a nice name for
         * @param {Object} fields array of field definitions. the attribute should belong to the provided set of fields
         */
        function aliasedFieldName(attribName, fields) {
            let fName = attribName;

            // search for aliases
            if (fields) {
                const attribField = fields.find(field => {
                    return field.name === attribName;
                });
                if (attribField && attribField.alias && attribField.alias.length > 0) {
                    fName = attribField.alias;
                }
            }
            return fName;
        }
    }
})();
