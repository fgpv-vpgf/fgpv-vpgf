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

    function layerRegistryFactory($q, $timeout, gapiService, legendService, Geo) {

        return (geoState, config) => layerRegistry(geoState, geoState.mapService.mapObject, config);

        function layerRegistry(geoState, mapObject, config) {

            const layers = {}; // collection of LAYER_RECORD objects

            // this `service` object will be exposed through `geoService`
            const service = {
                legend: null,
                layers,
                constructLayers,
                removeLayer,
                reloadLayer,
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

            // FIXME: for debug purposes
            // FIXME: remove
            window.RV._debug = {};
            window.RV._debug.layers = service.layers;
            window.RV._debug.legend = service.legend;
            window.RV._debug.graphicsLayerIds = mapObject.graphicsLayerIds;
            window.RV._debug.layerIds = mapObject.layerIds;
            window.RV._debug.geoState = geoState;

            // set event handler for extent changes
            gapiService.gapi.events.wrapEvents(
                geoState.mapService.mapObject,
                {
                    'extent-change': extentChangeHandler
                }
            );

            // store service in geoState
            geoState.layerRegistry = service;

            return service;

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
                    .filter(lr => lr.config.layerType === layerType);
            }

            // FIXME  add a check to see if layer has config setting for not supporting a click
            /**
             * Retrieves all queryable layer records.
             * First filters for all queryable layers, then filters for layers which are
             * in a valid state.
             * @return {Array} array of layer records
             */
            function getAllQueryableLayerRecords() {
                return Object.keys(layers).map(key => layers[key])
                    .filter(layerRecord => Geo.Layer.QUERYABLE.indexOf(layerRecord.config.layerType) !== -1)
                    .filter(layerRecord => layerRecord.state !== Geo.Layer.States.ERROR);
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
                const lr = service.layers[layerId];
                makeScaleSet(lr).then(scaleSet => lr.legendEntry.setLayerScaleFlag(scaleSet));
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
             * @param  {Object} layerRecord   a LayerRecord object
             * @return {Promise}              resolves with mapping of layer indexes to boolean off-scale status
             */
            function makeScaleSet(layerRecord) {

                const currScale = geoState.mapService.mapObject.getScale();
                const result = {};
                const promises = []; // list of promises that must resolve before we are ready

                // TODO will likely need to adjust logic to take WMS/OpenFormat layers scale properties
                if (layerRecord.attributeBundle && layerRecord.attributeBundle.indexes) {
                    // attributes were loaded for this layer. iterate through all sublayers in the bundle
                    layerRecord.attributeBundle.indexes.forEach(featureIdx => {
                        // wait for medatadata to load, then calculate the scale
                        promises.push(layerRecord.attributeBundle[featureIdx].layerData.then(layerData => {
                            result[featureIdx] = isOffScale(currScale, layerData.minScale, layerData.maxScale);
                        }));

                    });
                } else {
                    // grab min and max from layer itself, use zero as featureIdx
                    result['0'] = isOffScale(currScale, layerRecord._layer.minScale, layerRecord._layer.maxScale);
                }

                // promise of result that resovles after all promises[] resolve
                return $q.all(promises).then(() => result);
            }

            /**
             * Finds a position at which to insert the source layer so it's positioned directly above target layer (if one specified).
             * If the target layer is no specified, the source layer is placed at the bottom of its sort group.
             *
             * NOTE the ESRI map stack does not reflect the legend and is arranged in reverse order
             * for ESRI low index = low drawing order; legend: low index = high drawing order
             * See design notes in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/514 for more details
             *
             * @param {String} sourceId the id of the layer to be moved
             * @param {String} targetId the id of the layer the target layer will be moved on top of; can be -1, if its the end of the list
             * @return {Number}          index at which the source layer should be inserted in the map stack
             */
            function getLayerInsertPosition(sourceId, targetId) {
                console.log(sourceId);
                console.log(targetId);
                console.log(layers);
                const sourceEntry = service.layers[sourceId].legendEntry;
                const targetEntry = typeof targetId !== 'undefined' ? service.layers[targetId].legendEntry : null;

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
             * IMPORTANT NOTE: targetId __must__ be the id of the layer which is actually in the map stack; this can't be a placholder which is not added to the map object
             *
             * @param {String} sourceId the id of the layer to be moved
             * @param {String} targetId the id of the layer the target layer will be moved on top of; can be -1, if its the end of the list
             */
            function moveLayer(sourceId, targetId) {
                const sourceLayer = service.layers[sourceId]._layer;
                const targetIndex = getLayerInsertPosition(sourceId, targetId);

                _testSyncCheck();

                // console.log(`reodder ${sourceId} on ${targetIndex}`);
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
             * FIXME this should move into a method on LegendEntry
             * @param {Object} layerEntry the layer entry used to generate the bounding box
             * @param {Boolean} visible the visibility state of the bounding box,
             * it is permitted to attempt to transition from true->true or false->false
             * these transitions will be ignored by the method
             */
            function setBboxState(layerEntry, visible) {
                const layerRecord = layers[layerEntry.id];
                if (!visible) {
                    if (layerRecord.bbox) {
                        layerRecord.destroyBbox(mapObject);
                    }
                    return;
                }
                if (layerRecord.bbox) {
                    return;
                }
                layerRecord.createBbox(mapObject);
            }

            /**
             * Creates esri layer object for a set of layer config objects, triggers attribute loading on layer load event and adds it to the legend afterwards.
             * @param  {Array} layerBlueprints array of layer configuration objects
             */
            function constructLayers(layerBlueprints) {
                layerBlueprints.forEach(layerBlueprint => {
                    // get the layer config from blueprint
                    // TODO: decouple identifyservice from everything
                    layerBlueprint.generateLayer().then(lr => {
                        console.info(lr);
                        registerLayerRecord(lr);
                        const pos = createPlaceholder(lr);
                        console.log(`adding ${lr.config.name} to map at ${pos}`);
                        lr.addStateListener(makeFirstLoadHandler(lr));
                        mapObject.addLayer(lr._layer, pos);
                        // HACK: for a file-based layer, call onLoad manually since such layers don't emmit events
                        if (lr._layer.loaded) {
                            lr.onLoad();
                        }
                    });
                });
            }

            // this should be in legend service
            // it should bind layerRecord.legendEntry after creating the placeholder
            function createPlaceholder(lr) {
                const sourceIndex = ref.legendService.addPlaceholder(lr);
                let targetId = service.legend.items[sourceIndex + 1];

                // FIXME: remove 'placeholder' part of the id; should be fixed by refactor - split layer id and legend id on legend entry
                targetId = typeof targetId === 'undefined' ? targetId : targetId.id.replace('placeholder', '');
                return getLayerInsertPosition(lr.layerId, targetId);

            }

            function makeFirstLoadHandler(lr) {
                const listener = state => {
                    if (state === Geo.Layer.States.LOADED) {
                        lr.removeStateListener(listener);
                        const opts = lr.legendEntry.options;
                        if (opts.hasOwnProperty('boundingBox') && opts.boundingBox.value) {
                            setBboxState(lr.legendEntry, true);
                        }
                        const wkid = geoState.mapService.mapObject.spatialReference.wkid;
                        if (lr.config.layerType === 'esriTile' && lr._layer.spatialReference.wkid !== wkid) {
                            opts.visibility.enabled = false;
                            opts.visibility.value = false;
                        }
                        setScaleDepState(lr.layerId);
                    }
                };
                return listener;
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

                mapObject.removeLayer(l._layer);
                delete service.layers[layerId]; // remove layer from the registry
            }

            /**
             * Reload a layer.  Can accept LayerRecords or LegendEntries
             * @param {LayerRecord|LegendEntry} l the layer to be reloaded
             */
            function reloadLayer(l) {
                // FIXME do a proper test when LegendEntry becomes a proper class
                const lr = l._layerRecord || l;
                mapObject.removeLayer(lr._layer);
                mapObject.addLayer(lr.constructLayer());
            }

            function registerLayerRecord(lr) {
                if (!lr.layerId) {
                    throw new Error('Attempt to register layer without id property');
                }
                if (layers[lr.layerId]) {
                    throw new Error(`Attempt to register layer already registered.  id: ${lr.layerId}`);
                }
                service.layers[lr.layerId] = lr;
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
