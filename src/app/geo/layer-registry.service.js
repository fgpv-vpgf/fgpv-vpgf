(() => {
    'use strict';

    /**
     * @ngdoc service
     * @module layerRegistry
     * @memberof app.geo
     * @requires gapiService
     * @requires mapService
     * @requires layerTypes
     * @requires configDefaults
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

            const layers = {};

            // this `service` object will be exposed through `geoService`
            const service = {
                /**
                 * Reference to the map legend
                 * @member legend
                 */
                legend: null,
                /**
                 * Collection of LayerRecord objects.  Maps `LayerRecord.id` -> `LayerRecord`.
                 * @see LayerRecord
                 * @member layers
                 */
                layers,

                constructLayers,
                removeLayer,
                zoomToScale,
                reloadLayer,
                snapshotLayer,
                aliasedFieldName,
                getLayersByType,
                getAllQueryableLayerRecords,
                moveLayer,
                checkDateType,
                setBboxState,
                getLayerMapIndex,
                _refactorIsLayerInMapStack // temporary function, will likely be removed after refactor
            };

            const ref = {
                legendService: legendService(config, service)
            };

            service.legend = ref.legendService.legend;

            // for debug purposes
            // FIXME: add a debug flag which controls if these should be bound
            window.RV.debug = {};
            window.RV.debug.layers = service.layers;
            window.RV.debug.legend = service.legend;
            window.RV.debug.graphicsLayerIds = mapObject.graphicsLayerIds;
            window.RV.debug.layerIds = mapObject.layerIds;
            window.RV.debug.geoState = geoState;
            window.RV.debug.gapi = gapiService.gapi;

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
             * @function _refactorIsLayerInMapStack
             * @private
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
             * Retrieves all layer records of the specified type.
             * @function getLayersByType
             * @param {String} layerType the type of layer to be filtered
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
             * @function getAllQueryableLayerRecords
             * @return {Array} array of layer records
             */
            function getAllQueryableLayerRecords() {
                return Object.keys(layers).map(key => layers[key])
                    .filter(layerRecord => Geo.Layer.QUERYABLE.indexOf(layerRecord.config.layerType) !== -1)
                    .filter(layerRecord => layerRecord.state !== Geo.Layer.States.ERROR);
            }

            /**
             * Handler for map extent change.
             * @function extentChangeHandler
             * @private
             * @param  {Object} params event parameters
             */
            function extentChangeHandler(params) {
                geoState.mapService.clearHilight();
                if (params.levelChange) {
                    // refresh scale state of all layers
                    Object.keys(service.layers).forEach(layerId => {
                        setScaleDepState(layerId);
                    });
                }
            }

            /**
             * Update scale status of a layer.
             * @function setScaleDepState
             * @private
             * @param  {String} layerId       layer id of layer to update
             */
            function setScaleDepState(layerId) {
                const lr = service.layers[layerId];
                makeScaleSet(lr).then(scaleSet => lr.legendEntry.setLayerScaleFlag(scaleSet));
            }

            /**
             * Determines if a scale is outside the given bounds.
             * @function isOffScale
             * @private
             * @param  {Integer} scale           scale value to test
             * @param  {Integer} minScale        minimum invalid scale level for zoom out, 0 for none
             * @param  {Integer} maxScale        maximum invalid scale level for zoom in, 0 for none
             * @return {Object}                  scaleSet.value = true if scale is outside valid bound
             */
            function isOffScale(scale, minScale, maxScale) {
                // GIS for dummies.
                // scale increases as you zoom out, decreases as you zoom in
                // minScale means if you zoom out beyond this number, hide the layer
                // maxScale means if you zoom in past this number, hide the layer
                // 0 value for min or max scale means there is no hiding in effect
                const scaleSet = {
                    value: false,
                    zoomIn: false
                };

                // check if out of scale and set zoom direction to scaleSet
                if (scale < maxScale && maxScale !== 0) {
                    scaleSet.value = true;
                    scaleSet.zoomIn = false;
                } else if (scale > minScale && minScale !== 0) {
                    scaleSet.value = true;
                    scaleSet.zoomIn = true;
                }

                return scaleSet;
            }

            /**
             * Generate a mapping of feature indexes to off-scale status for a layer.
             * @function makeScaleSet
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
             * Given a LayerRecord find the position it currently occupies within the map.
             * @function getLayerMapIndex
             * @param {LayerRecord} layerRecord
             * @return {Number} An integer specifying the position of the layer within the appropriate ESRI map stack
             */
            function getLayerMapIndex(layerRecord) {
                const mapStackSwitch = [mapObject.graphicsLayerIds, mapObject.layerIds];
                return mapStackSwitch[layerRecord.legendEntry.sortGroup].indexOf(layerRecord.layerId);
            }

            /**
             * Finds a position at which to insert the source layer so it's positioned directly above target layer (if one specified).
             * If the target layer is no specified, the source layer is placed at the bottom of its sort group.
             *
             * NOTE the ESRI map stack does not reflect the legend and is arranged in reverse order
             * for ESRI low index = low drawing order; legend: low index = high drawing order.
             * See design notes in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/514 for more details.
             *
             * @function getLayerInsertPosition
             * @param {String} sourceId the id of the layer to be moved
             * @param {String} targetId the id of the layer the target layer will be moved on top of; can be -1, if its the end of the list
             * @return {Number}          index at which the source layer should be inserted in the map stack
             */
            function getLayerInsertPosition(sourceId, targetId) {
                const sourceEntry = service.layers[sourceId].legendEntry;
                const targetEntry = typeof targetId !== 'undefined' ? service.layers[targetId].legendEntry : null;
                const mapStackSwitch = [mapObject.graphicsLayerIds, mapObject.layerIds];

                const sourceIndex = getLayerMapIndex(service.layers[sourceId]);
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
             * calling this function immediately before or after the legend is updated.
             *
             * IMPORTANT NOTE: targetId __must__ be the id of the layer which is actually in the map stack; this can't be a placholder which is not added to the map object.
             *
             * @function moveLayer
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
             * @function _testSyncCheck
             * @private
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
             * @function setBboxState
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
             * @function constructLayers
             * @param  {Array} layerBlueprints array of layer configuration objects
             */
            function constructLayers(layerBlueprints) {
                layerBlueprints.forEach(layerBlueprint => {
                    // get the layer config from blueprint
                    // TODO: decouple identifyservice from everything
                    layerBlueprint.generateLayer().then(lr => {
                        registerLayerRecord(lr);
                        const pos = createPlaceholder(lr);
                        console.log(`adding ${lr.config.name} to map at ${pos}`);
                        lr.addStateListener(makeFirstLoadHandler(lr));
                        mapObject.addLayer(lr._layer, pos);
                        // HACK: for a file-based layer, call onLoad manually since such layers don't emmit events
                        if (lr._layer.loaded) {
                            lr.onLoad();
                            lr.onUpdateEnd();
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

            // FIXME add docs
            function makeFirstLoadHandler(lr) {
                const firstListener = state => {
                    if (state !== Geo.Layer.States.LOADED) { return; }
                    lr.removeStateListener(firstListener);
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
                };
                return firstListener;
            }

            /**
             * Removes the layer from the map and from the layer registry; This will not remove the corresponding legend entry.
             * @function removeLayer
             * @param {Number} layerId  the id of the layer to be removed
             * TODO: needs more work for removing dynamic layers and its children;
             */
            function removeLayer(layerId) {
                const l = layers[layerId];

                // TODO: don't fail silently; throw an error; maybe shown message to the user.
                if (!l) {
                    throw new Error();
                }

                if (l.bbox) {
                    l.destroyBbox(mapObject);
                }

                mapObject.removeLayer(l._layer);
                delete service.layers[layerId]; // remove layer from the registry
            }

            /**
             * Zoom to visibility scale.
             * @function zoomToScale
             * @param {Number} layerId  the id of the layer to zoom to scale to
             * @param {Boolean} zoomIn the zoom to scale direction; true need to zoom in; false need to zoom out
             *
             */
            function zoomToScale(layerId, zoomIn) {
                const l = layers[layerId]._layer;
                const lods = zoomIn ? geoState.lods : [...geoState.lods].reverse();
                const lod = lods.find(lod => zoomIn ? lod.scale < l.minScale : lod.scale > l.maxScale);

                // if zoom in is needed; must find center of layer's full extent and perform center&zoom
                if (zoomIn) {
                    // need to reproject in case full extent in a different sr than basemap
                    const gextent = gapiService.gapi.proj.localProjectExtent(l.fullExtent,
                        mapObject.spatialReference);
                    const reprojLayerFullExt = gapiService.gapi.mapManager.Extent(gextent.x0, gextent.y0,
                        gextent.x1, gextent.y1, gextent.sr);

                    // check if current map extent already in layer extent
                    mapObject.setScale(lod.scale).then(() => {
                        // if map extent not in layer extent, zoom to center of layer extent
                        // don't need to return Deferred otherwise because setScale already resolved here
                        if (!reprojLayerFullExt.intersects(mapObject.extent)) {
                            return mapObject.centerAt(reprojLayerFullExt.getCenter());
                        }
                    });
                } else {
                    return mapObject.setScale(lod.scale);
                }
            }

            /**
             * Reload a layer.  Can accept LayerRecords or LegendEntries.
             * @function reloadLayer
             * @param {LayerRecord|LegendEntry} l the layer to be reloaded
             * @param {Function} configUpdate an optional function which will be passed the configuration
             *                   of the given layer and can make changes before the new layer is loaded
             */
            function reloadLayer(l, configUpdate) {
                // FIXME do a proper test when LegendEntry becomes a proper class
                const lr = l._layerRecord || l;
                const pos = getLayerMapIndex(lr);
                mapObject.removeLayer(lr._layer);
                if (configUpdate) {
                    configUpdate(lr.config);
                }
                mapObject.addLayer(lr.constructLayer(), pos);
            }

            /**
             * Switch a feature layer to snapshot mode.
             * @function snapshotLayer
             * @param {LayerRecord|LegendEntry} l the layer to be reloaded
             */
            function snapshotLayer(l) {
                const configUpdate = cfg => cfg.options.snapshot.value = true;
                reloadLayer(l, configUpdate);
            }

            /**
             * Register a LayerRecord object within this service.  Is added the `layers` object internally.
             * Layer IDs must be unique.
             * @function registerLayerRecord
             * @param {LayerRecord} lr
             */
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
             * @function aliasedFieldName
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
             * Check to see if the attribute in question is an esriFieldTypeDate type.
             * FIXME refactor and move to geoapi
             * @function checkDateType
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
