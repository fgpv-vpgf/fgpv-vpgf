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

            const layers = {}; // collection of LAYER_RECORD objects

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
                moveLayer,
                checkDateType,
                setBboxState,
                _refactorIsLayerInMapStack // temporary function, will likely be removed after refactor
            };

            const ref = {
                legendService: legendService(config, service)
            };

            service.legend = ref.legendService.legend;

            // jscs doesn't like enhanced object notation
            // jscs:disable requireSpacesInAnonymousFunctionExpression
            const LAYER_RECORD = {
                attributeBundle: undefined,
                _formattedAttributes: undefined,

                layer: undefined,
                initialState: undefined,
                state: undefined, // legend entry
                bbox: undefined, // bounding box layer

                /**
                 * Retrieves attributes from a layer for a specified feature index
                 * @param  {Number} featureIdx feature id on the service endpoint
                 * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
                 */
                getAttributes(featureIdx) {
                    if (this._formattedAttributes.hasOwnProperty(featureIdx)) {
                        return this._formattedAttributes[featureIdx];
                    }

                    const layerPackage = this.attributeBundle[featureIdx];
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
                    this.attributeBundle = attributeBundle;

                    this._formattedAttributes = {};

                    return this;
                }
            };
            // jscs:enable requireSpacesInAnonymousFunctionExpression

			// FIXME: for debug purposes
            // FIXME: remove
            window.RV._debug = {};
            window.RV._debug.layers = service.layers;
            window.RV._debug.legend = service.legend;
            window.RV._debug.graphicsLayerIds = mapObject.graphicsLayerIds;
            window.RV._debug.layerIds = mapObject.layerIds;


            // set event handler for extent changes
            gapiService.gapi.events.wrapEvents(
                geoState.mapService.mapObject,
                {
                    'extent-change': extentChangeHandler
                }
            );

            return initialRegistration();

            /***/

            /**
             * Checks whether the supplied layer id is in the map stack;
             * This should be not needed after state machine refactor;
             * @param  {Number}  layerId   layer id
             * @param  {Number}  sortGroup layer sort group
             * @return {Boolean}           indicates if the layer is in the map stack
             */
            function _refactorIsLayerInMapStack(layerId, sortGroup) {
                const mapStackSwitch = [
                    mapObject.graphicsLayerIds,
                    mapObject.layerIds
                ];

                return mapStackSwitch[sortGroup].indexOf(layerId.replace('placeholder', '')) !== -1;
            }

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
                    // filter nonqueryable layers
                    .filter(layerRecord =>
                        layerTypesQueryable.indexOf(layerRecord.initialState.layerType) !== -1)
                    // filter out layers in the error state
                    // FIXME: refactor with the state machine
                    .filter(layerRecord =>
                        layerRecord.state.state !== 'rv-error');
            }

            /**
             * Handler for map extent change.
             * @private
             * @param  {Object} params event parameters
             */
            function extentChangeHandler(params) {
                if (params.levelChange) {
                    // refresh scale state of all layers
                    Object.keys(service.layers).forEach(layerId => {
                        setScaleDepState(layerId);
                    });
                }
            }

            /**
             * Update scale status of a layer
             * @private
             * @param  {String} layerId       layer id of layer to update
             */
            function setScaleDepState(layerId) {
                const lReg = service.layers;
                makeScaleSet(lReg[layerId]).then(scaleSet => {
                    ref.legendService.setLayerScaleFlag(lReg[layerId], scaleSet);
                });
            }

            /**
             * Determines if a scale is outside the given bounds
             * @private
             * @param  {Integer} scale           scale value to test
             * @param  {Integer} minScale        minimum invalid scale level for zoom out, 0 for none
             * @param  {Integer} maxScale        maximum invalid scale level for zoom in, 0 for none
             * @return {Boolean}                 true if scale is outside valid bound
             */
            function isOffScale(scale, minScale, maxScale) {
                // GIS for dummies.
                // scale increases as you zoom out, decreases as you zoom in
                // minScale means if you zoom out beyond this number, hide the layer
                // maxScale means if you zoom in past this number, hide the layer
                // 0 value for min or max scale means there is no hiding in effect
                return (scale < maxScale && maxScale !== 0) || (scale > minScale && minScale !== 0);
            }

            /**
             * Generate a mapping of feature indexes to off-scale status for a layer
             * @private
             * @param  {Object} layerRegItem  layer registry entry for the layer to analyze
             * @return {Promise}              resolves with mapping of layer indexes to boolean off-scale status
             */
            function makeScaleSet(layerRegItem) {

                const currScale = geoState.mapService.mapObject.getScale();
                const result = {};
                const promises = []; // list of promises that must resolve before we are ready

                // TODO will likely need to adjust logic to take WMS/OpenFormat layers scale properties
                if (layerRegItem.attributeBundle && layerRegItem.attributeBundle.indexes) {
                    // attributes were loaded for this layer. iterate through all sublayers in the bundle
                    layerRegItem.attributeBundle.indexes.forEach(featureIdx => {
                        // wait for medatadata to load, then calculate the scale
                        promises.push(layerRegItem.attributeBundle[featureIdx].layerData.then(layerData => {
                            result[featureIdx] = isOffScale(currScale, layerData.minScale, layerData.maxScale);
                        }));

                    });
                } else {
                    // grab min and max from layer itself, use zero as featureIdx
                    result['0'] = isOffScale(currScale, layerRegItem.layer.minScale, layerRegItem.layer.maxScale);
                }

                // promise of result that resovles after all promises[] resolve
                return $q.all(promises).then(() => result);
            }

            function getLayerInsertPosition(sourceId, targetId) {
                const sourceEntry = service.layers[sourceId].state;
                const targetEntry = typeof targetId !== 'undefined' ? service.layers[targetId].state : null;

                const mapStackSwitch = [
                    mapObject.graphicsLayerIds,
                    mapObject.layerIds
                ];

                const sourceIndex = mapStackSwitch[sourceEntry.sortGroup].indexOf(sourceId);
                let targetIndex;

                // if targetEntry is null, meaning the layer is dropped at the end of the list or
                // the layer is dropped on top of a different group
                if (targetEntry === null || sourceEntry.sortGroup !== targetEntry.sortGroup) {
                    // put the layer at the bottom of its sort group on top of any unregistered layers (basemap layers)
                    // this finds the first layer which is in the map stack and not registered (basemap layer)
                    targetIndex = mapStackSwitch[sourceEntry.sortGroup].findIndex(layerId =>
                        service.layers.hasOwnProperty(layerId));
                    targetIndex = targetIndex !== -1 ? targetIndex : mapStackSwitch[sourceEntry.sortGroup].length;

                // if the layer is dropped on another layer in its sort group, get index of that layer
                } else if (sourceEntry.sortGroup === targetEntry.sortGroup) {
                    // get the index of the target layer in the appropriate map stack
                    targetIndex = mapStackSwitch[sourceEntry.sortGroup].indexOf(targetId);

                    // need to add 1 when moving layer up in the legend (down in the map stack)
                    targetIndex += sourceIndex > targetIndex ? 1 : 0;
                } else {
                    // TODO: I'm not sure what happened; unforseen condition
                    throw new Error('Halp!');
                }

                return targetIndex;
            }

            /**
             * Move a source layer within the map on top (visually) of the target layer.
             *
             * NOTE this does not modify the legend, movement within the legend should be handled separately, ideally
             * calling this function immediately before or after the legend is updated
             *
             * NOTE the ESRI map stack does not reflect the legend and is arranged in reverse order
             * for ESRI low index = low drawing order; legend: low index = high drawing order
             * See design notes in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/514 for more details
             *
             * IMPORTANT NOTE: targetId __must__ be the id of the layer which is actually in the map stack; this can't be a placholder which is not added to the map object
             *
             * @param {String} sourceId the id of the layer to be moved
             * @param {String} targetId the id of the layer the target layer will be moved on top of; can be -1, if its the end of the list
             */
            function moveLayer(sourceId, targetId) {
                const sourceLayer = service.layers[sourceId].layer;
                const targetIndex = getLayerInsertPosition(sourceId, targetId);

                _testSyncCheck();

                //console.log(`reodder ${sourceId} on ${targetIndex}`);
                mapObject.reorderLayer(sourceLayer, targetIndex);
            }

            /**
             * This is temporary function to make sure the mapstack and legend is in sync;
             */
            function _testSyncCheck() {
                // remove all layer id from the map stacks which are not present in the legend
                const fullMapStack =
                    [].concat(mapObject.graphicsLayerIds.slice().reverse(), mapObject.layerIds.slice().reverse())
                    .filter(layerId => service.layers.hasOwnProperty(layerId));

                // remove all layer ids from the legend which are not preset in the map stack
                const fullLegendStack = service.legend.items
                    .filter(entry => _refactorIsLayerInMapStack(entry.id, entry.sortGroup))
                    .map(entry => entry.id);

                // compare the order of layer ids in both arrays - they should match
                fullMapStack.forEach((layerId, index) => {
                    if (fullLegendStack[index] !== layerId) {
                        console.error('Map stack is out of ~~whack~~ sync!');
                        console.warn('fullMapStack', fullMapStack);
                        console.warn('fullLegendStack', fullLegendStack);
                        return;
                    }
                });

                console.log('Map stack is in sync with legend');
            }

            /**
             * Set the visibility of the bounding box for the specified layer.
             * @param {Object} layerEntry the layer entry used to generate the bounding box
             * @param {Boolean} visible the visibility state of the bounding box,
             * it is permitted to attempt to transition from true->true or false->false
             * these transitions will be ignored by the method
             */
            function setBboxState(layerEntry, visible) {
                const esriLayer = layers[layerEntry.id].layer;
                const makeBbox = gapiService.gapi.layer.bbox.makeBoundingBox; // because our names are way too long
                if (!visible) {
                    if (layers[layerEntry.id].bbox) {
                        mapObject.removeLayer(layers[layerEntry.id].bbox);
                        layers[layerEntry.id].bbox = undefined;
                    }
                    return;
                }
                if (visible && layers[layerEntry.id].bbox) {
                    return;
                }
                const box = makeBbox(`bbox_${layerEntry.id}`, esriLayer.fullExtent, mapObject.extent.spatialReference);
                mapObject.addLayer(box);
                layers[layerEntry.id].bbox = box;
            }

            /**
             * Creates esri layer object for a set of layers provided by the config, triggers attribute loading on layer load event and adds it to the legend afterwards.
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

                    // create layerRecord only once
                    const layerRecord = registerLayer(layer, layerConfig);

                    // add a placeholder and store its index
                    const sourceIndex = ref.legendService.addPlaceholder(layerRecord);

                    // TODO investigate potential issue -- load event finishes prior to this event registration, thus attributes are never loaded
                    gapiService.gapi.events.wrapEvents(layer, {
                        // TODO: add error event handler to register a failed layer, so the user can reload it
                        load: () => {
                            console.log('## layer load', layer.id);

                            // FIXME look at layer config for flags indicating not to load attributes
                            // FIXME if layer type is not an attribute-having type (WMS, Tile, Image, Raster, more?), resolve an empty attribute set instead

                            // make sure the placeholder hasn't been removed
                            if (!layerRecord.state.removed) {
                                // handles the asynch loading of attributes
                                // get the attributes for the layer
                                let attributesPromise = $q.resolve(null);
                                if (layerNoattrs.indexOf(layerConfig.layerType) < 0) {
                                    attributesPromise = loadLayerAttributes(layer);
                                }

                                // replace placeholder with actual layer
                                const index = ref.legendService.legend.remove(layerRecord.state);

                                // set attribute bundle on the layer record
                                // TODO: refactor;
                                /* attributeBundle a promise resolving with the attributes associated with the layer (empty set if no attributes)
                                *  index an optional index indicating at which position the layer was added to the map
                                * (if supplied it is the caller's responsibility to make sure the layer is added in the correct location)
                                * */
                                layerRecord._attributeBundle = attributesPromise;
                                ref.legendService.addLayer(layerRecord, index); // generate actual legend entry

                                // TODO refactor this as it has nothing to do with layer registration;
                                // will likely change as a result of layer reloading / reordering / properly ordered legend
                                const opts = layerRecord.state.options;
                                if (opts.hasOwnProperty('boundingBox') && opts.boundingBox.value) {
                                    setBboxState(layerRecord.state, true);
                            }
                            }
                        },
                        error: data => {
                            console.error('## layer error', layer.id, data);

                            // TODO: if layer errors on initial loading, swith it to the error state
                            // since this seems to happen sporadically, maybe don't change the template to errored placeholder on the fisrt error and wait for some time or for the next error or something like that

                            // switch placeholder to error
                            // ref.legendService.setLayerState(placeholders[layer.id], layerStates.error, 100);

                            // FIXME layers that fail on initial load will never be added to the layers list
                            ref.legendService.setLayerState(layerRecord.state, layerStates.error, 100);
                            ref.legendService.setLayerLoadingFlag(layerRecord.state, false, 100);
                        },
                        'update-start': data => {
                            console.log('## update-start', layer.id, data);

                            // in case the layer registration was bypassed (e.g. placeholder removed)
                            if (service.layers[layer.id]) {
                                ref.legendService.setLayerLoadingFlag(service.layers[layer.id].state, true, 300);
                            }
                        },
                        'update-end': data => {
                            console.log('## update-end', layer.id, data);

                            // TODO: need to restore layer to normal state if it errored previously

                            // in case the layer registration was bypassed (e.g. placeholder removed)
                            if (service.layers[layer.id]) {
                                ref.legendService.setLayerLoadingFlag(service.layers[layer.id].state, false, 100);
                            } else {
                                // If the placeholder was removed then remove the layer from the map object
                                mapObject.removeLayer(mapObject.getLayer(layer.id));
                            }
                        }
                    });

                    // Make sure the placeholder is still there
                    if (!layerRecord.state.removed) {

                        let targetId = service.legend.items[sourceIndex + 1];

                        // FIXME: remove 'placeholder' part of the id; should be fixed by refactor - split layer id and legend id on legend entry
                        targetId = typeof targetId === 'undefined' ? targetId : targetId.id.replace('placeholder', '');
                        const targetIndex = getLayerInsertPosition(layerRecord.initialState.id, targetId);

                        console.log(`adding ${layerRecord.state.name} to map at ${targetIndex}`);

                        // add layer to the map triggering its loading process
                        mapObject.addLayer(layer, targetIndex);
                    }
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
                    throw new Error();
                }

                mapObject.removeLayer(l.layer);
                delete service.layers[layerId]; // remove layer from the registry
            }

            /**
             * Adds a layer object to the layers registry
             * @param {object} layer the API layer object
             * @param {object} initialState a configuration fragment used to generate the layer
             *
             */
            function registerLayer(layer, initialState) {
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
                    .init(layer, initialState);

                service.layers[layer.id] = layerRecord;

                return layerRecord;
                }

                // set scale state
                setScaleDepState(layer.id);

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
                const fieldNameArray = [];
                const columns = layerData.fields
                    .filter(field =>
                        // assuming there is at least one attribute - empty attribute budnle promises should be rejected, so it never even gets this far
                        // filter out fields where there is no corresponding attribute data
                        attributes.features[0].attributes.hasOwnProperty(field.name))
                    .map(field => {
                        // check if date type; append key to fieldNameArray if so
                        if (field.type === 'esriFieldTypeDate') {
                            fieldNameArray.push(field.name);
                        }
                        return {
                            data: field.name,
                            title: field.alias || field.name
                        };
                    });

                // extract attributes to an array consumable by datatables
                const rows = attributes.features.map(feature => feature.attributes);

                // convert each date cell to ISO format
                fieldNameArray.forEach(fieldName => {
                    rows.forEach(row => {
                        const date = new Date(row[fieldName]);
                        row[fieldName] = date.toISOString().substring(0, 10);
                    });
                });

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
                return false;
            }
        }
    }
})();
