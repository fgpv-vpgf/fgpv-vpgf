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

    function layerRegistryFactory($q, $timeout, gapiService, legendService, layerTypes, layerStates, layerNoattrs,
        layerTypesQueryable) {

        return (geoState, config) => layerRegistry(geoState, geoState.mapService.mapObject, config);

        function layerRegistry(geoState, mapObject, config) {

            const layers = {}; // layer collection

            // this `service` object will be exposed through `geoService`
            const service = {
                legend: null,
                layers,
                constructLayers,
                generateLayer,
                registerLayer,
                removeLayer,
                aliasedFieldName,
                getLayersByType,
                getAllQueryableLayerRecords,
                getLayerIndexAbove,
                moveLayer,
                checkDateType
            };

            const ref = {
                legendService: legendService(config, service)
            };

            service.legend = ref.legendService.legend;

            // jscs doesn't like enhanced object notation
            // jscs:disable requireSpacesInAnonymousFunctionExpression
            const LAYER_RECORD = {
                _attributeBundle: undefined,
                _formattedAttributes: undefined,

                layer: undefined,
                initialState: undefined,
                state: undefined, // legend entry

                /**
                 * Retrieves attributes from a layer for a specified feature index
                 * @param  {Number} featureIdx feature id on the service endpoint
                 * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
                 */
                getAttributes(featureIdx) {
                    if (this._formattedAttributes.hasOwnProperty(featureIdx)) {
                        return this._formattedAttributes[featureIdx];
                    }

                    const layerPackage = this._attributeBundle[featureIdx];
                    const attributePromise =
                        $q.all([
                            layerPackage.getAttribs(),
                            layerPackage.layerData
                        ])
                        .then(([attributes, layerData]) =>
                            formatAttributes(attributes, layerData)
                        );

                    return (this._formattedAttributes[featureIdx] = attributePromise);
                },

                /**
                 * Initializes layer record.
                 * @param  {Object} layer           esri layer object
                 * @param  {Object} initialState    layer config values
                 * @param  {Object} attributeBundle geoApi attribute bundle
                 * @return {Object}                 layer record object`
                 */
                init(layer, initialState, attributeBundle) {
                    this.layer = layer;
                    this.initialState = initialState;
                    this._attributeBundle = attributeBundle;

                    this._formattedAttributes = {};

                    return this;
                }
            };
            // jscs:enable requireSpacesInAnonymousFunctionExpression

            return initialRegistration();

            /***/

            /**
             * Retrieves all  layer records of the specified type
             * @return {Array} array of  layer records
             */
            function getLayersByType(layerType) {
                return Object.keys(layers).map(key => layers[key])
                    .filter(layer => layer.state && layer.state.layerType === layerType);
            }

            // FIXME  add a check to see if layer has config setting for not supporting a click
            /**
             * Retrieves all queryable layer records
             * @return {Array} array of layer records
             */
            function getAllQueryableLayerRecords() {
                return Object.keys(layers).map(key => layers[key])
                    .filter(layerRecord =>
                        // TODO: filter out layers in error state
                        layerTypesQueryable.indexOf(layerRecord.initialState.layerType) !== -1);
            }

            /**
             * Returns the index of the layer in the ESRI stack which is above the given legend position.
             * Only top level items in the legend are traversed.
             * NOTE the ESRI map stack does not reflect the legend and is arranged in reverse order
             * for ESRI low index = low drawing order; legend: low index = high drawing order
             * See design notes in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/514 for more details
             *
             * @param {Number} legendPosition index of the layer within the legend
             * @return {Number} the position of the layer above in the particular ESRI layer stack
             */
            function getLayerIndexAbove(legendPosition) {
                const layer = service.legend.items[legendPosition].layer;

                // ESRI keeps graphical (WMS, Tile, Image) layers separate from feature layers
                // pick the appropriate list of layer IDs based on the type of layer being interrogated
                const list = layerNoattrs.indexOf(layer.layerType) < 0 ? mapObject.layerIds : mapObject.graphicLayerIds;
                const nextEntry = service.legend.items.find((entry, idx) =>
                    list.indexOf(entry.layer.id) > -1 && idx > legendPosition);
                if (typeof nextEntry === 'undefined') {
                    // take the last position if there are no valid layers in the legend
                    // there may be utility layers (e.g. highlight, bounding box) which may be in the ESRI list
                    // but not in the legend
                    return list.length;
                }
                return list.indexOf(nextEntry.layer.id);
            }

            /**
             * Move a given layer within the map to match a specific position in the legend.
             * NOTE this does not modify the legend, movement within the legend should be handled separately, ideally
             * calling this function immediately before or after the legend is updated
             *
             * @param {String} id the id of the layer to be moved
             * @param {Number} position the new position of the layer within the legend
             */
            function moveLayer(id, position) {
                const curPos = service.legend.items.findIndex(e => e.id === id);
                const layer = service.legend.items[curPos].layer;
                mapObject.reorderLayer(layer, getLayerIndexAbove(position));
            }

            /**
             * Creates esri layer object for a set of layers provided by the config, triggers attribute loading on layer load event and adds it to the legend afterwards.
             * // TODO: might need to abstract this further to accomodate user-added layers as they need to go through the same process
             * @return {Object} self for chaining
             */
            function initialRegistration() {
                constructLayers(config.layers);

                // store service in geoState
                geoState.layerRegistry = service;

                return service;
            }

            /**
             * Creates esri layer object for a set of layer config objects, triggers attribute loading on layer load event and adds it to the legend afterwards.
             * @param  {Array} layerConfigs array of layer configuration objects
             */
            function constructLayers(layerConfigs) {
                layerConfigs.forEach(layerConfig => {
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
                            let attributesPromise = $q.resolve(null);
                            if (layerNoattrs.indexOf(layerConfig.layerType) < 0) {
                                attributesPromise = loadLayerAttributes(layer);
                            }
                            service.registerLayer(layer, layerConfig, attributesPromise); // https://reviewable.io/reviews/fgpv-vpgf/fgpv-vpgf/286#-K9cmkUQO7pwtwEPOjmK
                        },
                        error: data => {
                            console.error('layer error', layer.id, data);

                            // FIXME layers that fail on initial load will never be added to the layers list
                            // ref.legendService.setLayerState(service.layers[layer.id], layerStates.error, 100);
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
            }

            /**
             * Starts loading attributes for the specified layer.
             * @param  {Object} layer esri layer object
             * @return {Promise} a promise resolving with the retrieved attribute data
             */
            function loadLayerAttributes(layer) {
                return gapiService.gapi.attribs.loadLayerAttribs(layer);
            }

            /**
             * Removes the layer from the map and from the layer registry; This will not remove the corresponding legend entry.
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
            }

            /**
             * Adds a layer object to the layers registry
             * @param {object} layer the API layer object
             * @param {object} initialState a configuration fragment used to generate the layer
             * @param {promise} attributeBundle a promise resolving with the attributes associated with the layer (empty set if no attributes)
             * @param {number} position an optional index indicating at which position the layer was added to the map
             * (if supplied it is the caller's responsibility to make sure the layer is added in the correct location)
             */
            function registerLayer(layer, initialState, attributeBundle) {
                if (!layer.id) {
                    console.error('Attempt to register layer without id property');
                    console.log(layer);
                    console.log(initialState);
                }

                if (layers[layer.id]) {
                    console.error('attempt to register layer already registered.  id: ' + layer.id);
                    return false;
                }

                const layerRecord = Object.create(LAYER_RECORD)
                    .init(layer, initialState, attributeBundle);

                service.layers[layer.id] = layerRecord;
                ref.legendService.addLayer(layerRecord); // generate legend entry

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

                // `replace` strips trailing slashes
                // TODO: Aly's comment:
                // I think we have more than one of these strip trailing slash and get the feature index in our codebase. We should move it as a utility into geoApi at some point.
                // Aleks: I suggest this as the only place to strip slashes from urls;
                layerConfig.url = layerConfig.url.replace(/\/+$/, '');

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
                    commonConfig.visibleLayers = config.layerEntries.map(le => le.id);
                    return new gapiService.gapi.layer.ogc.WmsLayer(config.url, commonConfig);
                };

                if (handlers.hasOwnProperty(layerConfig.layerType)) {
                    return handlers[layerConfig.layerType](layerConfig);
                } else {
                    throw new Error('Your layer type is unacceptable');
                }
            }

            /**
             * Formats raw attributes to the form consumed by the datatable
             * @param  {Object} attributes raw attribute data returned from geoapi
             * @return {Object} layerData  layer data returned from geoApi
             * @return {Object}               formatted attribute data { data: Array, columns: Array, fields: Array, oidField: String, oidIndex: Object}
             */
            function formatAttributes(attributes, layerData) {
                // create columns array consumable by datables
                const columns = layerData.fields
                    .filter(field =>
                        // assuming there is at least one attribute - empty attribute budnle promises should be rejected, so it never even gets this far
                        // filter out fields where there is no corresponding attribute data
                        attributes.features[0].attributes.hasOwnProperty(field.name))
                    .map(field => {
                        return {
                            data: field.name,
                            title: field.alias || field.name
                        };
                    });

                // extract attributes to an array consumable by datatables
                const rows = attributes.features.map(feature => feature.attributes);

                return {
                    columns,
                    rows,
                    fields: layerData.fields, // keep fields for reference ...
                    oidField: layerData.oidField, // ... keep a reference to id field ...
                    oidIndex: attributes.oidIndex // ... and keep id mapping array
                };
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

            /**
             * Check to see if the attribute in question is an esriFieldTypeDate type
             * @param {String} attribName the attribute name we want to check if it's a date or not
             * @param {Array} fields array of field definitions. the attribute should belong to the provided set of fields
             * @return {Boolean} returns true or false based on the attribField type being esriFieldTypeDate
             */
            function checkDateType(attribName, fields) {
                if (fields) {
                    const attribField = fields.find(field => {
                        return field.name === attribName;
                    });
                    if (attribField && attribField.type) {
                        return attribField.type === 'esriFieldTypeDate';
                    }
                }
            }
        }
    }
})();
