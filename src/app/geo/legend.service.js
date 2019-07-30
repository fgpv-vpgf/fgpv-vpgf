import {
    LegendItem,
    LegendGroup
} from 'api/legend';

/**
 * @module legendService
 * @memberof app.geo
 * @description
 *
 * The `legendService` factory constructs the legend (auto or structured). `LayerRegistry` instantiates `LegendService` providing the current config, layers and legend containers.
 * This service also scrapes layer symbology.
 *
 */
angular.module('app.geo').factory('legendService', legendServiceFactory);

function legendServiceFactory(
    $rootScope,
    Geo,
    ConfigObject,
    configService,
    stateManager,
    LegendBlock,
    LayerBlueprint,
    layerRegistry,
    common,
    events
) {
    const service = {
        constructLegend,
        importLayerBlueprint,
        reloadBoundLegendBlocks,
        addLayerDefinition,
        removeLegendBlock
    };

    let mApi = null;
    let elementsForApi = [];
    events.$on(events.rvApiMapAdded, (_, api) => {
        mApi = api;
        elementsForApi.forEach(element => _addElementToApiLegend(element));
    });

    // wire in a hook to any map for adding a layer through a JSON snippet. this makes it available on the API
    events.$on(events.rvMapLoaded, () => {
        configService.getSync.map.instance.addConfigLayer = layerJSON => {
            const layerRecords = configService.getSync.map.layerRecords;

            const index = layerRecords.find(layerRecord => layerRecord.layerId === layerJSON.id);

            if (!index) {
                let addToLegend = false;
                if (configService.getSync.map.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE) {
                    addToLegend = true;
                }

                const layer = service.addLayerDefinition(layerJSON, null, addToLegend);
                $rootScope.$applyAsync();
                return common.$q(resolve => {
                    events.$on(events.rvApiLayerAdded, (_, layers) => {
                        if ((layers.length > 0) && (layers[0].id === layerJSON.id)) {
                            resolve(layers);
                        }
                    });
                });
            } else {
                return common.$q.resolve([]);
            }
        };

        configService.getSync.map.instance.setLegendConfig = (legendStructure) => {
            mApi.panels.getById('enhancedTable').close();
            mApi.panels.getById('sideMetadata').close();
            mApi.panels.getById('sideSettings').close();

            const apiLayers = mApi.layers.allLayers
                // filter on the existence of a viewerLayer config, this will strip out 'simpleLayer's
                .filter(l => l._viewerLayer.config)
                .map(l => l._viewerLayer.config.source);
            const viewerLayers = configService.getSync.map.layers;
            const layers = apiLayers.concat(viewerLayers.filter(layer => apiLayers.indexOf(layer) < 0));
            const newLegend = new ConfigObject.legend.Legend(legendStructure, layers);
            service.constructLegend(layers, newLegend);

            configService.getSync.map._legend = newLegend;
            layerRegistry.synchronizeLayerOrder();
            $rootScope.$applyAsync();
        };
    });

    return service;

    /***/

    /**
     * Traverses a given legend structure and creates a corresponding hierarchy of legend blocks using any references layers from the supplied layer defintions array.
     * It's possible to have layer definitions references more than once or not at all in the legend structure.
     *
     * @function constructLegend
     * @param {Array} layerDefinitions an array of layer definitions from the config file or RCS snippets
     * @param {Array} legendStructure a typed legend hierarchy containing Entry, EntryGroup, VisibilitySet, and InfoSections items
     */
    function constructLegend(layerDefinitions, legendStructure) {
        const mapConfig = configService.getSync.map;

        const layerBlueprintsCollection = mapConfig.layerBlueprints;
        const legendMappings = mapConfig.legendMappings;
        const newDefinitions = [];

        layerDefinitions.forEach(ld => {
            let index = layerBlueprintsCollection.findIndex(blueprint => blueprint.config.id === ld.id);
            const legendItem = legendStructure.root
                .walk(
                    entry =>
                    entry.layerId === ld.id || (entry.controlledIds && entry.controlledIds.indexOf(ld.id) > -1) ?
                    entry :
                    null
                )
                .filter(a => a)[0];

            // if the layer is being readded to the legend, regenerate the layer record to have up-to-date settings
            if (index !== -1 && legendItem) {
                const blueprint = layerBlueprintsCollection[index];
                layerRegistry.regenerateLayerRecord(blueprint);
            }
            // there is no blueprint already created for the layer, need to create one
            else {
                newDefinitions.push(ld);
            }
        });

        // all layer defintions are passed as config fragments - turn them into layer blueprints
        newDefinitions.map(createBlueprint);

        // create mapping for all layer blueprints
        mapConfig.layerBlueprints.forEach(lb => (legendMappings[lb.config.id] = []));

        const legendBlocks = _makeLegendBlock(legendStructure.root, layerBlueprintsCollection);
        mapConfig.legendBlocks = legendBlocks;

        if (mApi) {
            mApi.ui.configLegend._children = [];
            mApi.ui.configLegend._sortGroup = [
                [],
                []
            ];
        }

        legendBlocks.entries.filter(entry => !entry.hidden).forEach(entry => {
            // after ConfigLegend created, check to see if a LegendGroup/Item already exists
            // if so, update it (_initSettings) instead of creating a new instance
            if (entry.blockConfig.entryType === 'legendGroup' && !entry.collapsed) { // use constant
                let legendGroup = new LegendGroup(configService.getSync.map, entry);
                _addElementToApiLegend(legendGroup);
            } else { // it's a collapsed dynamic layer or a node/infoSection
                let legendItem = new LegendItem(configService.getSync.map, entry);
                _addElementToApiLegend(legendItem);
            }
        });
    }

    /**
     * Instantiates and registers a layer blueprint based on the given layer definition,
     * and imports it into the legend.
     *
     * @function addLayerDefinition
     * @param {LayerDefinition} layerDefinition a layer definition from the config file or RCS snippets
     * @param {pos} optional position for layer to be on the legend
     * @param {Boolean} addToLegend   indicates whether layer should be automatically added to legend. default true
     */
    function addLayerDefinition(layerDefinition, pos = null, addToLegend = true) {
        importLayerBlueprint(createBlueprint(layerDefinition), pos, addToLegend);
    }

    /**
     * Instantiates and registers a layer blueprint based on the given layer definition.
     *
     * @function createBlueprint
     * @param {LayerDefinition} layerDefinition a layer definition from the config file or RCS snippets
     * @returns {LayerBlueprint} generated layer blueprint
     */
    function createBlueprint(layerDefinition) {
        const blueprint = LayerBlueprint.makeBlueprint(layerDefinition);
        configService.getSync.map.layerBlueprints.push(blueprint);
        return blueprint;
    }

    /**
     * Imports a layer blueprint, adds it to the map and to the legend structure.
     *
     * @function importLayerBlueprint
     * @param {LayerBlueprint} layerBlueprint a layer blueprint to be imported into the map and added to the legend
     * @param {pos} optional position for layer to be on the legend
     * @param {Boolean} addToLegend   indicates whether layer should be automatically added to legend. default true
     * @return {LegendBlock} returns a corresponding, newly created legend block
     */
    function importLayerBlueprint(layerBlueprint, pos = null, addToLegend = true) {
        const layerBlueprintsCollection = configService.getSync.map.layerBlueprints;
        layerBlueprintsCollection.push(layerBlueprint);

        const legendBlocks = configService.getSync.map.legendBlocks;

        // add a new mapping for layer blueprint
        const legendMappings = configService.getSync.map.legendMappings;
        legendMappings[layerBlueprint.config.id] = [];

        // when adding a layer through the layer loader, set symbology render style as images for wms;
        // TODO: this can potentially move to blueprint code
        const entryConfigObject = {
            layerId: layerBlueprint.config.id,
            symbologyRenderStyle: layerBlueprint.config.layerType === Geo.Layer.Types.OGC_WMS ?
                ConfigObject.legend.Entry.IMAGES : ConfigObject.legend.Entry.ICONS
        };

        const sortGroups = Geo.Layer.SORT_GROUPS_;

        const importedBlockConfig = new ConfigObject.legend.Entry(entryConfigObject);
        const importedLegendBlock = _makeLegendBlock(importedBlockConfig, [layerBlueprint]);

        if (!addToLegend) {
            return;
        }

        let position = 0;
        // find an appropriate spot in a auto legend;
        if (pos) {
            // If the order from bookmark exists
            position = pos;
        } else if (legendBlocks && configService.getSync.map.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE) {
            const layerType = importedLegendBlock.layerType;
            const sortGroup = layerType ? sortGroups[layerType] : 1; // layerType doesn't exist, legend block is a group
            position = legendBlocks.entries.findIndex(
                block => !block.layerType || sortGroups[block.layerType] >= sortGroup
            );

            // if the sort group for this layer doesn't exist, insert at the bottom of the legend
            position = position === -1 ? legendBlocks.entries.length : position;
        }

        // add the new legend block to the legend block (always to the root group)
        if (legendBlocks) {
            legendBlocks.addEntry(importedLegendBlock, position);
        }

        // after ConfigLegend created, check to see if a LegendGroup/Item already exists
        // if so, update it (_initSettings) instead of creating a new instance
        if (!importedLegendBlock.hidden) {
            if (importedLegendBlock.blockConfig.entryType === 'legendGroup' && !importedLegendBlock.collapsed) { // use constant
                let legendGroup = new LegendGroup(configService.getSync.map, importedLegendBlock);
                _addElementToApiLegend(legendGroup);
            } else { // it's a collapsed dynamic layer or a node/infoSection
                let legendItem = new LegendItem(configService.getSync.map, importedLegendBlock);
                _addElementToApiLegend(legendItem);
            }
        }

        // add the new block config to the legend config (always to the root group), so it will be preserved when map is rebuilt
        configService.getSync.map.legend.addChild(importedBlockConfig, position);

        return importedLegendBlock;
    }

    /**
     * Reloads the layer record with the specified id in place and refreshes all legend blocks referencing this layer record.
     * Also, this will trigger reloading of all additional layer records controlled by legend blocks related to this layer record.
     *
     * @function reloadBoundLegendBlocks
     * @param {String} layerRecordId the layer record id
     * @return {Promise<LegendBlock>} resolving to legend block parent of block reloaded
     */
    function reloadBoundLegendBlocks(layerRecordId) {
        // reset mapping for this layer blueprint
        const legendMappings = configService.getSync.map.legendMappings;
        const mappings = legendMappings[layerRecordId];
        legendMappings[layerRecordId] = [];

        let promise;

        // create a new record from its layer blueprint
        const layerBlueprintsCollection = configService.getSync.map.layerBlueprints;
        const layerBlueprint = layerBlueprintsCollection.find(blueprint => blueprint.config.id === layerRecordId);
        layerRegistry.regenerateLayerRecord(layerBlueprint);

        mappings.forEach(({
            legendBlockId,
            legendBlockConfigId
        }) => {
            // need to find the actual legend block mapped to the legendBlock being reloaded and its parent container legendGroup
            const legendBlocks = configService.getSync.map.legendBlocks;
            const {
                legendBlock,
                legendBlockParent
            } = legendBlocks
                .walk(
                    (entry, index, parentEntry) =>
                    entry.id === legendBlockId ? {
                        legendBlock: entry,
                        legendBlockParent: parentEntry
                    } :
                    null
                )
                .filter(a => a !== null)[0];

            // need to find the block config the legend block was made from and create a new one
            const legend = configService.getSync.map.legend;
            const legendBlockConfig = legend.root
                .walk(child => (child.id === legendBlockConfigId ? child : null))
                .filter(a => a !== null)[0];

            // all controlled layer records __must__ be reloaded before the legend block is made
            // if this were to be done after, the state settings of the controlling legend block will not be applied correctly
            // (`regenerateLayerRecord` will remove the layer from the map, but it's the logic inside `_makeLegendBlock` that adds the layer back to the map)
            legendBlockConfig.controlledIds.forEach(controlledId => reloadBoundLegendBlocks(controlledId));

            const reloadedLegendBlock = _makeLegendBlock(legendBlockConfig, layerBlueprintsCollection);

            //if this is a collapsed dynamic group being reloaded, pop out its duplicate from the child array
            if (reloadedLegendBlock.collapsed && reloadedLegendBlock.isDynamicRoot) {
                mApi.ui.configLegend.children.pop();
            }

            //update the corresponding LegendItem in the Legend API
            if (reloadedLegendBlock instanceof LegendBlock.Node) {
                _updateApiReloadedBlock(reloadedLegendBlock);
            }

            const index = legendBlockParent.removeEntry(legendBlock);
            const layerRecordPromise = layerRegistry.getLayerRecordPromise(legendBlockConfig.layerId);

            _boundingBoxRemoval(legendBlock);
            legendBlockParent.addEntry(reloadedLegendBlock, index);

            if (promise) {
                // ensure only one promise is created
                return;
            }

            promise = layerRecordPromise.then(_handleLayerStateChange);

            /**
             * A helper function to watch the layer record loading state.
             *
             * @param {LayerRecord} layerRecord a layerRecord to watch for state
             * @returns {Promise<LegendBlock|string>} returns a promise resolving with a legendBlock if layer loads successfully or layer name if the layer fails to load
             */
            function _handleLayerStateChange(layerRecord) {
                // need time to reload children for Dynamic layers
                const p = common.$q((resolve, reject) => {
                    layerRecord.addStateListener(_onLayerRecordLoad);

                    function _onLayerRecordLoad(state) {
                        // add back entry
                        if (state === Geo.Layer.States.LOADED || state === Geo.Layer.States.ERROR) {
                            layerRecord.removeStateListener(_onLayerRecordLoad);
                        }

                        if (state === Geo.Layer.States.LOADED) {
                            resolve(legendBlockParent);
                        } else if (state === Geo.Layer.States.ERROR) {
                            reject(layerRecord.name);
                        }
                    }
                });

                return p;
            }
        });

        return promise;
    }

    /**
     * Removes the legend block from the layer selector and toggles the corresponding layer record to invisible.
     * Returns two functions to the caller to either finalize the removal process or undo it.
     * Removal of the legend block is only possible with the auto legend, so it's guaranteed that there one-to-one relationship between legend blocks and layer records.
     *
     * @function removeLegendBlock
     * @param {LegendBlock} legendBlock legend block to be removed from the layer selector
     * @return {Array} returns two functions [resolve, reject]; calling `resolve` will clean up by removing the hidden layer record form the map; calling `reject` will restore the legend block and the corresponding layer record to its previous visibility
     */
    function removeLegendBlock(legendBlock) {
        // store visibility for legendBlock and any children being removed
        let cache;
        if (legendBlock.entries) {
            cache = legendBlock.walk(item => item.visibility);
        } else {
            cache = legendBlock.visibility;
        }
        legendBlock.visibility = false;

        const legendBlocks = configService.getSync.map.legendBlocks;
        const legendBlockParent = legendBlocks
            .walk((entry, index, parentEntry) => (entry === legendBlock ? parentEntry : null))
            .filter(a => a !== null)[0];

        // TODO: instead of removing the legend block from the selector, just hide it with some css
        const index = legendBlockParent.removeEntry(legendBlock);
        _removeElementFromApiLegend(legendBlock);

        $rootScope.$applyAsync();

        return [_resolve, _reject];

        // FIXME: need to remove the enty from the legend config as well, or it will be recreated on the full state restore
        /**
         * A helper function that remove remaining layer elements from config.
         *
         * @function _resolve
         * @private
         */
        function _resolve() {
            // FIXME: in cases of removing dynamic children, they also need to be removed from the structure returned by `layerRecord.getChildTree()`
            // without this, loading from the bookmark, removed dynamic children will come back with their visibility set to "off"

            let layerRecordId = legendBlock.layerRecordId;

            // legendBlock.layerRecordId can be undefined if we recursively call 'removeLayer()' in tocService because we are
            // removing a groups parent. in that case we need to find the correct layerRecordId of the initial layer that was being removed
            if (layerRecordId === null) {
                layerRecordId = legendBlock
                    .walk(l => (l.layerRecordId !== null ? l.layerRecordId : null))
                    .filter(a => a)[0];
            }

            // check if any other blocks reference this layer record
            // if none found, it's safe to remove the layer record
            const isSafeToRemove =
                legendBlocks.walk(entry => entry.layerRecordId === layerRecordId).filter(a => a).length === 0;

            if (isSafeToRemove) {
                layerRegistry.removeLayerRecord(layerRecordId);
            }

            // remove any bounding box layers associated with this legend block
            _boundingBoxRemoval(legendBlock);

            // TODO: modify the legend accordingly to update our api legend object as well, currently it never changes
        }

        /**
         * A helper function that restored layer elements.
         *
         * @function _reject
         * @private
         */
        function _reject() {
            legendBlockParent.addEntry(legendBlock, index);
            // restore visibility of all legendBlock and any children
            if (legendBlock.entries) {
                legendBlock.walk(item => (item.visibility = cache.shift()));
            } else {
                legendBlock.visibility = cache;
            }
        }
    }

    /**
     * Remove the bounding box associated with the node or group
     *
     * @function _boundingBoxRemoval
     * @private
     * @param {LegendBlock} legendBlock legend block with bounding box to be removed from the map
     */
    function _boundingBoxRemoval(legendBlock) {
        if (legendBlock.blockType === LegendBlock.TYPES.NODE) {
            layerRegistry.removeBoundingBoxRecord(legendBlock.bboxId);
        } else if (legendBlock.blockType === LegendBlock.TYPES.GROUP) {
            legendBlock.entries.forEach(entry => layerRegistry.removeBoundingBoxRecord(entry.bboxId));
        }
    }

    /**
     * Recursively turns legend entry and group config objects into UI LegendBlock components.
     *
     * @function _makeLegendBlock
     * @private
     * @param {Object} blockConfig a config object for the legend block to be created (any children will be recursively created)
     * @param {Array} layerBlueprints a collection of all available layer blueprints
     * @return {LegendBlock} the resulting LegendBlock object
     */
    function _makeLegendBlock(blockConfig, layerBlueprints) {
        const legendTypes = ConfigObject.TYPES.legend;
        const legendMappings = configService.getSync.map.legendMappings;

        const TYPE_TO_BLOCK = {
            [legendTypes.INFO]: _makeInfoBlock,
            [legendTypes.NODE]: blockConfig => {
                // real blueprints are only available on Legend.NODEs
                const nodeBlueprints = {
                    main: _getLayerBlueprint(blockConfig.layerId),
                    controlled: blockConfig.controlledIds.map(id => _getLayerBlueprint(id))
                };

                // dynamic layers render as LegendGroup blocks; all other layers are rendered as LegendNode blocks;
                if (nodeBlueprints.main.config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    if (blockConfig.entryId || blockConfig.entryIndex) {
                        return _makeNodeBlock(blockConfig, nodeBlueprints);
                    } else {
                        return _makeDynamicGroupBlock(blockConfig, nodeBlueprints);
                    }
                } else {
                    return _makeNodeBlock(blockConfig, nodeBlueprints);
                }
            },
            [legendTypes.GROUP]: _makeGroupBlock,
            [legendTypes.SET]: _makeSetBlock
        };

        const legendBlock = TYPE_TO_BLOCK[blockConfig.entryType](blockConfig);

        return legendBlock;

        /**
         * Creates a LegendBlock.GROUP for a dynamic layer since it's represented in the UI as a group.
         * This group is not provided a proxy object from a LegendEntryRecord because a dynamic layer is specified as a single entry (not a group)
         * in the config and can control multiple other layers through its `controlledIds` property though.
         *
         * @function _makeDynamicGroupBlock
         * @private
         * @param {LayerNode} blockConfig legend entry config object
         * @param {Object} blueprints an object containing the main and controlled blueprints { main: <LayerBlueprint>, controlled: [<LayerBlueprint>] }
         * @return {LegendBlock.GROUP} the resulting LegendBlock.GROUP object
         */
        function _makeDynamicGroupBlock(blockConfig, blueprints) {
            const layerConfig = blueprints.main.config;

            layerConfig.cachedRefreshInterval = layerConfig.refreshInterval;

            const groupDefaults = ConfigObject.DEFAULTS.legend[ConfigObject.TYPES.legend.GROUP];

            // convention:
            // variable names ending in `source` are raw JSON objects
            // variable names ending in `config` are typed objects

            // this will load the layer record onto the map, but only need the root proxy of a dynamic layer to catch if it errors on initial loading
            const rootProxyPromise = _getLegendBlockProxy(blueprints.main);
            const rootProxyWrapper = new LegendBlock.ProxyWrapper(rootProxyPromise, layerConfig);
            // to create a group for a dynamic layer, create a entryGroup config object by using properties
            // from dynamic layer definition config object
            const derivedEntryGroupSource = {
                name: layerConfig.name,
                children: [],
                controls: common.intersect(layerConfig.controls, groupDefaults.controls),
                disabledControls: common.intersect(layerConfig.disabledControls, groupDefaults.controls)
            };

            // convert the newly created config source into a types config and a Legend Group
            const derivedEntryGroupConfig = new ConfigObject.legend.EntryGroup(derivedEntryGroupSource);
            const legendBlockGroup = new LegendBlock.Group(derivedEntryGroupConfig, rootProxyWrapper, true);
            // map this legend block to the layerRecord
            legendBlockGroup.layerRecordId = layerConfig.id;
            // store the provided metadataUrl on the parent group block
            legendBlockGroup.metadataUrl = blueprints.main.config.metadataUrl;

            legendMappings[layerConfig.id].push({
                legendBlockId: legendBlockGroup.id,
                legendBlockConfigId: blockConfig.id
            });

            // wait for the dynamic layer record to load to get its children
            const layerRecordPromise = layerRegistry.getLayerRecordPromise(blockConfig.layerId);
            _waitOnLayerLoad(layerRecordPromise).then(layerRecord => {
                // on loaded, create child LegendBlocks for the dynamic layer and
                // add them to the created LegendBlock.GROUP to be displayed in the UI (following any hierarchy provided)
                const tree = _createDynamicChildTree(layerRecord, layerConfig);
                tree.forEach(item => {
                    item.symbologyExpanded = blockConfig.symbologyExpanded;
                    _addChildBlock(blockConfig, item, legendBlockGroup);
                });

                if (legendBlockGroup.collapsed) {
                    _updateApiReloadedBlock(legendBlockGroup.entries[0]);
                } else {
                    _updateApiReloadedBlock(legendBlockGroup); //update Dynamic Group in the Legend API
                }
                legendBlockGroup.synchronizeControlledEntries();
            });

            // to handle controlled layers, first, get their proxies, it will load the layers,
            // then convert the list of return proxyWrappers into a list of LegendBlocks, marked them as controlled (makes them hidden in the layer selector),
            // and add to the main dynamic group
            blueprints.controlled.forEach(blueprint =>
                _getControlledLegendBlockProxy(blueprint).then(proxyWrappers => {
                    proxyWrappers.forEach(proxyWrapper => {
                        const entryConfig = new ConfigObject.legend.Entry({});
                        const legendBlock = new LegendBlock.Node(proxyWrapper, entryConfig);
                        legendBlock.controlled = true;
                        legendBlock.layerRecordId = layerConfig.id;

                        legendBlockGroup.addEntry(legendBlock);
                    });

                    // apply group settings to the newly added controlled entries so any settings modified by the user
                    // while the controlled layers were loading would apply on top as well
                    legendBlockGroup.synchronizeControlledEntries();
                })
            );

            const meetsCollapseCondition =
                layerConfig.layerEntries.filter(layerEntry => !layerEntry.stateOnly).length === 1;

            if (layerConfig.singleEntryCollapse && meetsCollapseCondition) {
                legendBlockGroup.collapsed = true;
            } else {
                // if collapse is not allowed, update the initial config value
                layerConfig.singleEntryCollapse = false;
            }

            return legendBlockGroup;

            /**
             * Traverses dynamic child tree and converts them to a hierarchy of LegendBlocks.
             *
             * @function _addChildBlock
             * @private
             * @param {Object} item a tree item in the form of { layerEntry: <Number>, childs: [<Object>], proxyWrapper: { proxy: <Proxy>, layerConfig: <LayerNode> } }, `childs` and `proxyWrapper` are mutually exclusive
             * @param {LegendBlock.GROUP} parentLegendGroup parent LegendGroup block when the newly created child will be added
             */
            // eslint-disable-next-line max-statements
            function _addChildBlock(blockConfig, item, parentLegendGroup) {
                let legendBlock, apiLegendElement;

                if (item.childs) {
                    const groupConfig = new ConfigObject.legend.EntryGroup(item.groupSource);
                    legendBlock = new LegendBlock.Group(groupConfig, rootProxyWrapper);
                    legendBlock.layerRecordId = layerConfig.id; // map all dynamic children to the block config and layer record of their root parent
                    legendBlock.metadataUrl = parentLegendGroup.metadataUrl; // store the provided metadataUrl on the parent group block

                    if (!legendBlock.hidden) {
                        if (!legendBlock.collapsed) {
                            apiLegendElement = new LegendGroup(configService.getSync.map, legendBlock);
                        } else {
                            apiLegendElement = new LegendItem(configService.getSync.map, legendBlock);
                        }

                        _addChildItemToAPI(apiLegendElement, parentLegendGroup);
                    }

                    item.childs.forEach(child => _addChildBlock(blockConfig, child, legendBlock));
                } else {
                    const entryConfig = new ConfigObject.legend.Entry(blockConfig);
                    item.proxyWrapper.metadataUrl = parentLegendGroup.metadataUrl; // store the provided metadataUrl on the proxy wrapper
                    legendBlock = new LegendBlock.Node(item.proxyWrapper, entryConfig);
                    legendBlock.layerRecordId = layerConfig.id; // map all dynamic children to the block config and layer record of their root parent

                    // show filter flag if there is a filter query being applied
                    // TODO may want to update this to use proxyWrapper.filterState.isActive() method.
                    legendBlock.filter =
                        (item.proxyWrapper.layerConfig.initialFilteredQuery !== undefined &&
                            item.proxyWrapper.layerConfig.initialFilteredQuery !== '') ? true : false;

                    if (!legendBlock.hidden) {
                        apiLegendElement = new LegendItem(configService.getSync.map, legendBlock);
                        _addChildItemToAPI(apiLegendElement, parentLegendGroup);
                    }
                }

                if (legendBlock.metadataUrl === undefined) {
                    legendBlock.disabledControls.push('metadata');
                }
                parentLegendGroup.addEntry(legendBlock);

                function _addChildItemToAPI(apiLegendElement, parentBlock) {
                    let parentElement = _findParentElement(parentBlock);
                    if (parentElement && parentElement.children) {
                        apiLegendElement.visibilityChanged.subscribe(() => {
                            const oldVisibility = parentElement.visibility;
                            if (oldVisibility !== parentElement._legendBlock.visibility) {
                                parentElement._visibilityChanged.next(parentElement._legendBlock.visibility);
                            }
                        });
                        apiLegendElement.opacityChanged.subscribe(() => {
                            const oldOpacity = parentElement.opacity;
                            if (oldOpacity !== parentElement._legendBlock.opacity) {
                                parentElement._opacityChanged.next(parentElement._legendBlock.opacity);
                            }
                        });
                        apiLegendElement.queryableChanged.subscribe(() => {
                            const oldQueryable = parentElement.queryable;
                            if (oldQueryable !== parentElement._legendBlock.query) {
                                parentElement._queryableChanged.next(parentElement._legendBlock.query);
                            }
                        });

                        _updateLegendElementSettings(apiLegendElement);
                        parentElement._children.push(apiLegendElement);
                    } else if (parentLegendGroup.collapsed) {

                        let blockFound = false;
                        mApi.ui.configLegend.children.forEach(child => {
                            if (child._legendBlock.layerRecordId === apiLegendElement._legendBlock.layerRecordId) {
                                child._initSettings(apiLegendElement._legendBlock);
                                blockFound = true;
                            }
                            if (child.id === parentLegendGroup.id) {
                                _removeElementFromApiLegend(child)
                            }
                        });

                        // if this block was an additon and not a reload add element to legend API
                        if (!blockFound) {
                            _addElementToApiLegend(apiLegendElement);
                        }
                    }
                }
            }
        }

        /**
         * Traverses the dynamic layer record childTree structure, defaults their config based on any optins specified
         * in the layer record config and their immediate parent, fetches corresponding proxies and stores proxyWrappers on the tree
         *
         * @function _createDynamicChildTree
         * @private
         * @param {LayerRecord} layerRecord the loaded dynamic layer record to travers
         * @param {LayerNode} layerConfig the typed and defaults config of the supplied dynamic layer record
         * @return {Object} a tree structure of dynamic children cast to proper legend block classes and with defaults applied
         */
        function _createDynamicChildTree(layerRecord, layerConfig) {
            const dynamicLayerChildDefaults = angular.copy(
                ConfigObject.DEFAULTS.layer[Geo.Layer.Types.ESRI_DYNAMIC].child
            );

            const groupDefaults = ConfigObject.DEFAULTS.legend[ConfigObject.TYPES.legend.GROUP];

            layerRecord.derivedChildConfigs = [];
            const tree = layerRecord.getChildTree();
            tree.forEach(treeChild => _createDynamicChildLegendBlock(treeChild, layerConfig.source));

            layerConfig.isResolved = true;

            return tree;

            /**
             * Recursively parses individual children of the dynamic layer record child tree.
             * If a child is a leaf, fetches it's proxy object and derives a layer config for that leaf. Proxy wrapper is stored directly on the child itself.
             * If a child is a group, derives the legend block config for this group, and runs itself on its children. Block config is stored on the child itself.
             *
             * @function _createDynamicChildLegendBlock
             * @private
             * @param {Object} treeChild a tree child object of the form { layerEntry: <Number>, childs: [<treechild>], name: <String> }, `childs` and `name` present only on groups
             * @param {Object} parentLayerConfigSource [optional] config of the child parent for derving state defaults
             */
            function _createDynamicChildLegendBlock(treeChild, parentLayerConfigSource = {}) {
                let childLegendBlock;

                let derivedLayerEntryConfig = _getLayerEntryConfig();

                // process as a group
                if (treeChild.childs) {
                    const originalSource = angular.merge({}, derivedLayerEntryConfig.source);

                    if (!layerConfig.isResolved) {
                        // converting a child source config into a group source config;
                        // for that we need to filter out `controls` array, add `name` and empty `children` array
                        const derivedChildGroupSource = angular.extend({}, originalSource, {
                            children: [],
                            controls: common.intersect(originalSource.controls, groupDefaults.controls),
                            disabledControls: common.intersect(originalSource.disabledControls, groupDefaults.controls),
                            userDisabledControls: common.intersect(
                                originalSource.userDisabledControls,
                                groupDefaults.controls
                            ),
                            name: treeChild.name
                        });

                        // convert and store at this point; pass derivedGroupSource as source for LegendGroup
                        derivedLayerEntryConfig = new ConfigObject.layers.DynamicLayerEntryNode(
                            derivedChildGroupSource,
                            true
                        );
                    }

                    treeChild.groupSource = derivedLayerEntryConfig.source;

                    treeChild.childs.forEach(subTreeChild =>
                        _createDynamicChildLegendBlock(subTreeChild, originalSource)
                    );
                } else {
                    // layerRecord is generated by this point, it's not a promise
                    const mainProxy = common.$q.resolve(layerRecord.getChildProxy(treeChild.entryIndex));
                    const proxyWrapper = new LegendBlock.ProxyWrapper(mainProxy, derivedLayerEntryConfig);

                    treeChild.proxyWrapper = proxyWrapper;
                }

                if (!layerConfig.isResolved) {
                    _saveLayerEntryConfig(derivedLayerEntryConfig);
                }

                /**
                 * Saves the defaulted and resolved layerEntry to the parent layer record's config.
                 * This will save the entries for dynamic subgroups as well to preserve the allowed and disabled controls arrays.
                 * This is needed to generate bookmark from the all layerEntries, specified in the config and autogenerated
                 * This will probably be also used in the full state restore later.
                 *
                 * @private
                 * @function _saveLayerEntryConfig
                 * @param {DynamicLayerEntryNode} layerEntryConfig fully defaulted dynamic child layer entry config
                 */
                function _saveLayerEntryConfig(layerEntryConfig) {
                    let index = layerConfig.layerEntries.findIndex(entry => entry.index === layerEntryConfig.index);

                    index = index === -1 ? layerConfig.layerEntries.length : index;

                    layerConfig.layerEntries[index] = layerEntryConfig;
                }

                /**
                 * Retrieves a layer entry config object for a dynamic child using `entryIndex` specified in the parent function.
                 * If a config cannot be found (for autogenerated children), creates an empty config source, defaults it, and converts to a proper config object.
                 * All config created in this way are marked with `stateOnly` as they should not appear in the legend UI, but should still contribute their state.
                 *
                 * @private
                 * @function _getLayerEntryConfig
                 * @return {DynamicLayerEntryNode} a retrieved or generated dynamic child config
                 */
                function _getLayerEntryConfig() {
                    // get the initial layerEntry config from the layer record config, or
                    // create a source object if config object can't be found (this will happen when the dynamic subgroups are expanded)
                    const defaultLayerEntryConfig = {
                        source: {
                            index: treeChild.entryIndex,
                            stateOnly: true
                        }
                    };

                    const layerEntryConfig =
                        layerConfig.layerEntries.find(entry => entry.index === treeChild.entryIndex) ||
                        defaultLayerEntryConfig;

                    if (layerConfig.isResolved) {
                        return layerEntryConfig;
                    }

                    // `layerEntryConfig` might have some controls and states specified;
                    // apply immediate parent state (which can be root) and child default values
                    const derivedChildLayerConfigSource = ConfigObject.applyLayerNodeDefaults(
                        layerEntryConfig.source,
                        dynamicLayerChildDefaults,
                        parentLayerConfigSource
                    );

                    // dynamic children might not support opacity if the layer is not a true dynamic layer
                    // in such cases the opacity control is user disabled for all children and opacity of the whole layer should be changed at the root
                    // in single entry collapse cases, the root is hidden, and opacity control is left user enabled at the top single entry; all subsequent children are user disabled as usual
                    if (
                        !layerRecord.isTrueDynamic &&
                        !(
                            layerConfig.singleEntryCollapse &&
                            derivedChildLayerConfigSource.index === layerConfig.layerEntries[0].index
                        )
                    ) {
                        derivedChildLayerConfigSource.userDisabledControls.push('opacity');
                        derivedChildLayerConfigSource.userDisabledControls.push('interval');
                    }

                    const derviedChildLayerConfig = new ConfigObject.layers.DynamicLayerEntryNode(
                        derivedChildLayerConfigSource,
                        true
                    );

                    return derviedChildLayerConfig;
                }
            }
        }

        /**
         * Create a LegendBlock.GROUP object for a structured group specified in the legend.
         * This group is not provided with a proxy object.
         * This parses the config object provided and populates both legendGroupRecord and LegendBlock.GROUP object with appropriate childProxies and LegenBlocks.
         *
         * @function _makeGroupBlock
         * @private
         * @param {Object} blockConfig legend group config object
         * @return {LegendBlock.GROUP} the resulting LegendBlock.GROUP object
         */
        function _makeGroupBlock(blockConfig) {
            const group = new LegendBlock.Group(blockConfig);

            blockConfig.children.forEach(childConfig => {
                const childBlock = _makeLegendBlock(childConfig, layerBlueprints);

                group.addEntry(childBlock);
            });

            return group;
        }

        /**
         * Creates a LegenBlock.NODE object for a legend entry specified in the legend.
         * This node is provided a proxy object from a LegendEntryRecord because a layer is specified as a single entry in the config.
         *
         * @function _makeNodeBlock
         * @private
         * @param {Object} blockConfig legend entry config object
         * @param {Object} blueprints an object containing the main and controlled blueprints { main: <LayerBlueprint>, controlled: [<LayerBlueprint>] }
         * @return {LegendBlock.NODE} the resulting LegendBlock.NODE object
         */
        function _makeNodeBlock(blockConfig, blueprints) {
            const layerConfig = blueprints.main.config;
            const mainProxyPromise = _getLegendBlockProxy(blueprints.main, blockConfig);

            // all wms layer default to image-style symbology, regardless of what the config says
            if (layerConfig.layerType === Geo.Layer.Types.OGC_WMS) {
                blockConfig.symbologyRenderStyle = ConfigObject.legend.Entry.IMAGES;

                layerConfig.layerEntries.forEach(entry => (entry.cachedStyle = entry.currentStyle));
            }

            layerConfig.cachedRefreshInterval = layerConfig.refreshInterval;

            const proxyWrapper = new LegendBlock.ProxyWrapper(mainProxyPromise, layerConfig);
            const node = new LegendBlock.Node(proxyWrapper, blockConfig);

            // map this legend block to the layerRecord
            node.layerRecordId = layerConfig.id;

            // show filter flag if there is a filter query being applied
            node.filter = false;

            // TODO may want to update this to use proxyWrapper.filterState.isActive() method to check if filters are on.
            if (layerConfig.table !== undefined && layerConfig.table.columns !== undefined) {
                // check whether tableNode exists on layerConfig
                // image layers, tile layers and wms layers are not going to have tableNodes
                layerConfig.table.columns.forEach(column => {
                    if (column.filter !== undefined && column.filter.value !== undefined) {
                        node.filter = true;
                    }
                })
            }

            legendMappings[layerConfig.id].push({
                legendBlockId: node.id,
                legendBlockConfigId: blockConfig.id
            });

            // handling controlled layers by getting their proxies and adding them as controlled proxies to the legend node
            blueprints.controlled.forEach(blueprint =>
                _getControlledLegendBlockProxy(blueprint).then(proxyWrappers =>
                    proxyWrappers.forEach(proxyWrapper => {
                        node.addControlledProxyWrapper(proxyWrapper);

                        // reapply state setting to the node so any settings changed by the user will apply to the newly added controlled proxy (this is possible if the controlled is a dynamic layer and there is a lag when fetching its child proxies)
                        node.synchronizeControlledProxyWrappers();
                    })
                )
            );

            return node;
        }

        /**
         * Creates a LegendBlock.INFO object for a legend infor section specified in the legend.
         *
         * @function _makeInfoBlock
         * @private
         * @param {Object} blockConfig legend info config object
         * @return {LegendBlock.INFO} the resulting LegendBlock.INFO object
         */
        function _makeInfoBlock(blockConfig) {
            const info = new LegendBlock.Info(blockConfig);

            return info;
        }

        /**
         * @function _makeSetBlock
         * @private
         * @param {Object} blockConfig legend block config from the config file
         * @return {LegendBlock.Set} create LegendBlock.Set instance
         */
        function _makeSetBlock(blockConfig) {
            const set = new LegendBlock.Set(blockConfig);
            let isSomethingTrue = false;

            blockConfig.exclusiveVisibility.forEach(childConfig => {
                // check to see if there is more than one child of the set that has visibility set to true
                // if so, turn all the others (except the first) to false to avoid problems with `proxyPromise` not yet resolved when updating set visibilities
                const blueprint = layerBlueprints.find(blueprint => blueprint.config.id === childConfig.layerId);
                if (blueprint && blueprint.config.state.visibility) {
                    if (isSomethingTrue) {
                        blueprint.config.state.visibility = false;
                    } else {
                        isSomethingTrue = true;
                    }
                }

                const childBlock = _makeLegendBlock(childConfig, layerBlueprints);

                set.addEntry(childBlock);
            });

            return set;
        }

        /**
         * A helper function creating (if doesn't exist) appropriate layerRecord for a provided blueprint returns its proxy objects as proxyWrappers array inside a promise.
         * Only entries (not groups or infos) can have direct proxies.
         * Promise is returned because it might be needed to wait for a dynamic layer record to load.
         * This will return a flat array of proxyWrappers for a dynamica layer record with the group nodes discarded.
         *
         * @function _getControlledLegendBlockProxy
         * @private
         * @param {LayerBlueprint} blueprint legend entry config object
         * @return {Promise} a promise resolving with an array of proxyWrappers
         */
        function _getControlledLegendBlockProxy(blueprint) {
            const layerRecordPromise = layerRegistry.registerLayerRecord(blueprint);
            const layerConfig = blueprint.config;
            layerRegistry.loadLayerRecord(blueprint.config.id);

            const disabledOptions = {
                controls: ['query', 'boundingBox'],
                state: ['query', 'boundingBox']
            };

            // for all controlled layers, disable query and boundingbox controls
            disabledOptions.controls.forEach(controlName => {
                if (layerConfig.disabledControls.indexOf(controlName) === -1) {
                    layerConfig.disabledControls.push(controlName);
                }
            });

            // controlled layers can't have enabled bounding boxes or query states (even if specified in the config file)
            disabledOptions.state.forEach(stateName => (layerConfig.state[stateName] = false));

            // controlled layers are not supposed to have hovertips
            layerConfig.hovertipEnabled = false;

            let proxyWrapperPromise;

            if (blueprint.config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                // wait for the layer record to finish generating, then set listener to wait until the record is fully loaded
                proxyWrapperPromise = _waitOnLayerLoad(layerRecordPromise).then(layerRecord => {
                    // tree consists of objects with entryIndex and its proxy wrapper,
                    // for controlledLayers only proxyWrappers are needed
                    const tree = _createDynamicChildTree(layerRecord, layerConfig);
                    const flatTree = _flattenTree(tree).map(item => item.proxyWrapper);

                    return flatTree;
                });
            } else {
                const proxyPromise = layerRecordPromise.then(layerRecord => layerRecord.getProxy());
                const proxyWrapper = new LegendBlock.ProxyWrapper(proxyPromise, layerConfig);

                proxyWrapperPromise = common.$q.resolve([proxyWrapper]);
            }

            return proxyWrapperPromise;

            /**
             * Flatten the tree of dynamic children and groups discarding all the group objects.
             *
             * @param {*} tree
             */
            function _flattenTree(tree) {
                const result = [].concat.apply(
                    [],
                    tree.map(item => {
                        if (item.childs) {
                            // when flattening the tree, the groups are discarded as they will not be used
                            return _flattenTree(item.childs);
                        } else {
                            return item;
                        }
                    })
                );

                return result;
            }
        }

        /**
         * A helper function creating (if doesn't exist) appropriate layerRecord for a provided blueprint returns its proxy object.
         * Only entries (not groups or infos) can have direct proxies.
         *
         * @function _getLegendBlockProxy
         * @private
         * @param {LayerBlueprint} blueprint legend entry config object
         * @return {Promise<Proxy>} a promise of a layer proxy object
         */
        function _getLegendBlockProxy(blueprint) {
            // hidden legend blocks can't have hover tooltips or query enabled on the layers
            if (blockConfig.hidden) {
                blueprint.config.state.query = false;
            }

            const layerRecordPromise = layerRegistry.registerLayerRecord(blueprint);
            layerRegistry.loadLayerRecord(blueprint.config.id);

            const proxyPromise = layerRecordPromise.then(layerRecord => {
                let proxy;

                if (blockConfig.entryIndex) {
                    proxy = layerRecord.getChildProxy(blockConfig.entryIndex);
                } else {
                    proxy = layerRecord.getProxy();
                }

                return proxy;
            });

            return proxyPromise;
        }

        /**
         * A helper function that returns a LayerBlueprint with a corresponding id from the collection of LayerBlueprints.
         *
         * @function _getLayerBlueprint
         * @private
         * @param {String} id id of the layerBlueprint (same as the layer defintion id from the config)
         * @return {LayerBlueprint|undefined} retuns a LayerBlueprint with a corresponding id or undefined if not found
         */
        function _getLayerBlueprint(id) {
            const blueprint = layerBlueprints.find(blueprint => blueprint.config.id === id);

            // TODO: this should return something meaningful for info sections and maybe sets?
            return blueprint;
        }

        /**
         * A helper function to wait on the layer load.
         *
         * @param {Promise<LayerRecord>} layerRecordPromise a layer record promise from the layer registry
         * @returns {Promise<LayerRecord>} a promise of a layer record which resolve when the record is fully loaded
         */
        function _waitOnLayerLoad(layerRecordPromise) {
            const promise = common.$q(resolve =>
                layerRecordPromise.then(layerRecord => {
                    // TODO: there is a potential for race condition if a listener is set too late
                    layerRecord.addStateListener(_onLayerRecordLoad);

                    function _onLayerRecordLoad(state) {
                        if (state !== Geo.Layer.States.LOADED) {
                            return;
                        }

                        layerRecord.removeStateListener(_onLayerRecordLoad);
                        resolve(layerRecord);
                    }
                })
            );

            return promise;
        }
    }

    /**
     * Get the parent of an item by id
     *
     * @function _getParentById
     * @private
     * @param {string} id the id for a LegendItem or LegendGroup to find the parent of
     * @param {Array<LegendItem|LegendGroup>} elementList list of elements to look through
     * @param {String|LegendGroup} parent parent item, passed in during recursion; defaults to 'root"'
     */
    function _getParentById(id, elementList = mApi.ui.configLegend.children, parent = 'root') {
        for (let item of elementList) {
            if (item.id === id) {
                return parent;
            } else if (item instanceof LegendGroup) {
                let match = _getParentById(id, item.children, item);
                if (match) {
                    return match instanceof LegendGroup ? match : item;
                }

            }
        }
    }

    /**
     * Push a new element to the list of elements for the map legend
     *
     * @function _addElementToApiLegend
     * @private
     * @param {LegendItem|LegendGroup} legendElement an instance of an api legend item/group created that needs to be added to map legend
     */
    function _addElementToApiLegend(legendElement) {
        if (mApi) {
            _updateLegendElementSettings(legendElement);

            //push new element into children and sortgroup arrays
            mApi.ui.configLegend.children.push(legendElement);
            if (typeof legendElement._legendBlock.sortGroup !== 'undefined') {
                mApi.ui.configLegend._sortGroup[legendElement._legendBlock.sortGroup].push(legendElement);
            }
        } else {
            elementsForApi.push(legendElement);
        }
    }

    /**
     * Update the API elements opacity and visibility after the proxy promise has resolved
     *
     * @function _updateLegendElementSettings
     * @private
     * @param {LegendItem|LegendGroup} legendElement an instance of an api legend item/group created that needs to be have its settings updated
     */
    function _updateLegendElementSettings(legendElement) {
        let wrapper;
        if (legendElement._legendBlock.proxyWrapper) {
            wrapper = legendElement._legendBlock.proxyWrapper;
        } else if (legendElement._legendBlock._rootProxyWrapper) {
            wrapper = legendElement._legendBlock._rootProxyWrapper;
        }

        if (wrapper) {
            const initialSettings = wrapper.layerConfig.state;
            wrapper.proxyPromise.then(() => {
                legendElement.visibility = initialSettings.visibility;
                legendElement.opacity = initialSettings.opacity;
                legendElement.queryable = initialSettings.query;
            });
        }
    }

    /**
     * Remove an existing element from the list of elements for the map legend
     *
     * @function _removeElementFromApiLegend
     * @private
     * @param {LegendItem|LegendGroup} legendElement an instance of an api legend item/group created that needs to be removed from map legend
     */
    function _removeElementFromApiLegend(legendBlock) {
        const apiLegendBlock = legendBlock.collapsed ? legendBlock.entries[0] : legendBlock;
        const legendElement = mApi.ui.configLegend.getById(apiLegendBlock.id);
        const parent = _getParentById(apiLegendBlock.id);

        if (parent === 'root') {
            let index = mApi.ui.configLegend.children.indexOf(legendElement);
            if (index > -1) {
                mApi.ui.configLegend.children.splice(index, 1);
                // mapApi.ui.configLegend._itemRemoved.next(legendElement);
            }
            const sortGroup = legendBlock.collapsed ? 1 : legendElement._legendBlock.sortGroup;
            if (typeof sortGroup !== 'undefined') {
                let sortIndex = mApi.ui.configLegend._sortGroup[sortGroup].indexOf(legendElement);
                if (sortIndex > -1) {
                    mApi.ui.configLegend._sortGroup[sortGroup].splice(sortIndex, 1);
                }
            }
        } else if (parent) {
            let index = parent.children.indexOf(legendElement);
            if (index > -1) {
                parent.children.splice(index, 1);
                // mapApi.ui.configLegend._itemRemoved.next(legendElement);
            }
        }
    }

    /**
     * Updates the LegendItem/LegendGroup that has been reloaded
     *
     * @function _updateApiReloadedBlock
     * @param {LegendGroup | LegendNode} reloadedBlock -the legendBlock that was reloaded
     */
    function _updateApiReloadedBlock(reloadedBlock) {
        // Only run when the parent is ready on the reloadedBlock
        const watchParent = $rootScope.$watch(() => reloadedBlock.parent, (parent, nullParent) => {
            layerRegistry.syncApiElementOrder();
            parent = parent.collapsed ? parent.parent : parent;
            const index = parent.entries.filter(entry => !entry.hidden).indexOf(reloadedBlock);
            const parentElement = parent.blockConfig === configService.getSync.map.legend.root ?
                mApi.ui.configLegend :
                _findParentElement(parent);

            if (index > -1 && parentElement) {
                parentElement.children[index]._initSettings(reloadedBlock);
            }

            watchParent();
        });
    }

    /**
     * Find and return the element with given parentBlock in the Legend API
     *
     * @function _findParentElement
     * @param {LegendGroup} parentBlock block of parent to find
     * @param {Array<LegendItem | LegendGroup>} list list of elements to search through
     * */
    function _findParentElement(parentBlock, list = mApi.ui.configLegend.children) {
        for (let element of list) {
            if (element._legendBlock === parentBlock) {
                return element;
            } else if (element.children) {
                const pElement = _findParentElement(parentBlock, element.children);
                if (pElement) {
                    return pElement;
                }
            }
        }
    }
}
