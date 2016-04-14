(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name layerRegistry
     * @module app.geo
     * @requires gapiService, mapService, layerTypes, configDefaults
     * @description
     *
     * The `layerRegistry` factory tracks active layers and constructs legend, provide all layer-related functionality like registering, removing, changing visibility, changing opacity, etc.
     *
     */
    angular
        .module('app.geo')
        .factory('layerRegistry', layerRegistryFactory);

    function layerRegistryFactory($q, $timeout, gapiService, legendService, layerTypes, layerStates) {
        return (geoState, config) => layerRegistry(geoState, geoState.mapService.mapObject, config);

        function layerRegistry(geoState, mapObject, config) {

            const layers = {}; // layer collection
            const legend = {
                items: []
            }; // legend construct, to be consumed by toc; deflection +2

            const ref = {
                legendService: legendService(config, layers, legend)
            };

            // this `service` object will be exposed through `geoService`
            const service = {
                legend,
                layers,

                generateLayer,
                registerLayer,
                getFormattedAttributes,
                removeLayer,
                aliasedFieldName
            };

            return constructLayers();

            /***/

            /**
             * Creates esri layer object for a set of layers provided by the config, triggers attribute loading on layer load event and adds it to the legend afterwards.
             * // TODO: might need to abstract this further to accomodate user-added layers as they need to go through the same process
             * @return {Object} self for chaining
             */
            function constructLayers() {
                config.layers.forEach(layerConfig => {
                    // TODO: decouple identifyservice from everything
                    const layer = service.generateLayer(layerConfig);

                    // TODO investigate potential issue -- load event finishes prior to this event registration, thus attributes are never loaded
                    gapiService.gapi.events.wrapEvents(layer, {
                        // TODO: add error event handler to register a failed layer, so the user can reload it
                        load: () => {
                            console.log('layer load', layer.id);

                            // FIXME look at layer config for flags indicating not to load attributes
                            // FIXME if layer type is not an attribute-having type (WMS, Tile, Image, Raster, more?), resolve an empty attribute set instead

                            // handles the asynch loading of attributes
                            // get the attributes for the layer
                            const attributesPromise = loadLayerAttributes(layer);
                            service.registerLayer(layer, layerConfig, attributesPromise); // https://reviewable.io/reviews/fgpv-vpgf/fgpv-vpgf/286#-K9cmkUQO7pwtwEPOjmK
                        },
                        error: data => {
                            console.log('layer error', layer.id, data);

                            ref.legendService.setLayerState(service.layers[layer.id], layerStates.error, 100);
                        },
                        'update-start': data => {
                            console.log('update-start', layer.id, data);

                            ref.legendService.setLayerLoadingFlag(service.layers[layer.id], true, 300);
                        },
                        'update-end': data => {
                            console.log('update-end', layer.id, data);

                            ref.legendService.setLayerLoadingFlag(service.layers[layer.id], false, 100);
                        }
                    });

                    // add layer to the map triggering its loading process
                    mapObject.addLayer(layer);
                });

                // store service in geoState
                geoState.layerRegistry = service;

                return service;
            }

            /**
             * Starts loading attributes for the specified layer.
             * @param  {Object} layer esri layer object
             * @return {Promise} a promise resolving with the retrieved attribute data
             */
            function loadLayerAttributes(layer) {
                return gapiService.gapi.attribs.loadLayerAttribs(layer)
                    .catch(exception => {
                        console.error(
                            'Error getting attributes for ' +
                            layer.name + ': ' +
                            exception);
                        console.log(layer);

                        // TODO we may want to resolve with an empty attribute item. depends how breaky things get with the bad layer
                        $q.reject(exception);
                    });
            }

            /**
             * Removes the layer from the map and from the layer registry
             * @param {Number} layerId  the id of the layer to be removed
             * TODO: needs more work for removing dynamic layers and its children;
             */
            function removeLayer(layerId) {
                const l = layers[layerId];

                // TODO: don't fail silently; throw an error; maybe shown message to the user.
                if (!l) {
                    return;
                }

                mapObject.removeLayer(l.layer);
                delete service.layers[layerId]; // remove layer from the registry

                ref.legendService.removeLayer(l);
            }

            /**
             * Adds a layer object to the layers registry
             * @param {object} layer the API layer object
             * @param {object} initialState a configuration fragment used to generate the layer
             * @param {promise} attribs a promise resolving with the attributes associated with the layer (empty set if no attributes)
             * @param {number} position an optional index indicating at which position the layer was added to the map
             * (if supplied it is the caller's responsibility to make sure the layer is added in the correct location)
             */
            function registerLayer(layer, initialState, attribs) {
                // TODO determine the proper docstrings for a non-service function that lives in a service

                if (!layer.id) {
                    console.error('Attempt to register layer without id property');
                    console.log(layer);
                    console.log(initialState);
                }

                if (layers[layer.id]) {
                    console.error('attempt to register layer already registered.  id: ' + layer.id);
                    return false;
                }

                const layerRecord = {
                    layer,
                    attribs,
                    initialState
                };

                layers[layer.id] = layerRecord;

                // TODO: apply config values
                ref.legendService.addLayer(layerRecord);

                // FIXME:
                window.RV.layers = window.RV.layers || {};
                window.RV.layers[layer.id] = layerRecord;
            }

            /**
             * Takes a layer in the config format and generates an appropriate layer object.
             * @param {object} layerConfig a configuration fragment for a single layer
             * @return {object} a layer object matching one of the esri/layers objects based on the layer type
             */
            function generateLayer(layerConfig) {
                const handlers = {};

                const commonConfig = {
                    id: layerConfig.id
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
                    return new gapiService.gapi.layer.ArcGISImageServiceLayer(config.url, commonConfig);
                };
                handlers[layerTypes.esriTile] = config => {
                    return new gapiService.gapi.layer.TileLayer(config.url, commonConfig);
                };
                handlers[layerTypes.ogcWms] = config => {
                    commonConfig.visibleLayers = [config.layerName];
                    return new gapiService.gapi.layer.ogc.WmsLayer(config.url, commonConfig);
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
    }
})();
