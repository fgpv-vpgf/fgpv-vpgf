/**
 * @module legendService
 * @memberof app.geo
 * @description
 *
 * The `legendService` factory constructs the legend (auto or structured). `LayerRegistry` instantiates `LegendService` providing the current config, layers and legend containers.
 * This service also scrapes layer symbology.
 *
 */
angular
    .module('app.geo')
    .factory('legendService', legendServiceFactory);

function legendServiceFactory(Geo, ConfigObject, configService, LegendBlock, LayerBlueprint,
    layerRegistry, common) {

    const service = {
        constructLegend,
        importLayerBlueprint,
        reloadBoundLegendBlocks,
        addLayerDefinition,
        removeLegendBlock
    };

    return service;

    /***/

    /**
     * Traverses a given legend structure and creates a corresponding hierarchy of legend blocks using any references layers from the supplied layer defintions array.
     * It's possible to have layer definitions references more than once or not at all in the legend structure.
     *
     * @function constructLegend
     * @param {Array} layerDefinitions an array of layer definitions from the config file or RCS snippets
     * @param {Array} legendStructure a typed legend hierarchy containing Enry, EntryGroup, VisibilitySet, and InfoSections items
     */
    function constructLegend(layerDefinitions, legendStructure) {
        const mapConfig = configService.getSync.map;

        const layerBlueprintsCollection = mapConfig.layerBlueprints;
        const legendMappings = mapConfig.legendMappings;

        // all layer defintions are passed as config fragments - turning them into layer blueprints
        const layerBlueprints = layerDefinitions.map(createBlueprint);

        // create mapping for all layer blueprints
        layerBlueprints.forEach(lb =>
            (legendMappings[lb.config.id] = []));

        const legendBlocks = _makeLegendBlock(legendStructure.root, layerBlueprintsCollection);
        mapConfig.legendBlocks = legendBlocks;
    }

    /**
     * Instantiates and registers a layer blueprint based on the given layer definition,
     * and imports it into the legend.
     *
     * @function addLayerDefinition
     * @param {LayerDefinition} layerDefinition a layer definition from the config file or RCS snippets
     * @param {pos} optional position for layer to be on the legend
     * @returns {LegendBlock} returns a corresponding, newly created legend block
     */
    function addLayerDefinition(layerDefinition, pos = null) {
        return importLayerBlueprint(createBlueprint(layerDefinition), pos);
    }

    /**
     * Instantiates and registers a layer blueprint based on the given layer definition.
     *
     * @function createBlueprint
     * @param {LayerDefinition} layerDefinition a layer definition from the config file or RCS snippets
     * @returns {LayerBlueprint} generated layer blueprint
     */
    function createBlueprint(layerDefinition) {
        const blueprint = new LayerBlueprint.service(layerDefinition);
        configService.getSync.map.layerBlueprints.push(blueprint);
        return blueprint;
    }

    /**
     * Imports a layer blueprint, adds it to the map and to the legend structure.
     *
     * @function importLayerBlueprint
     * @param {LayerBlueprint} layerBlueprint a layer blueprint to be imported into the map and added to the legend
     * @param {pos} optional position for layer to be on the legend
     * @return {LegendBlock} returns a corresponding, newly created legend block
     */
    function importLayerBlueprint(layerBlueprint, pos = null) {
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
                ConfigObject.legend.Entry.IMAGES :
                ConfigObject.legend.Entry.ICONS
        };

        const sortGroups = Geo.Layer.SORT_GROUPS_;

        const importedBlockConfig = new ConfigObject.legend.Entry(entryConfigObject);
        const importedLegendBlock = _makeLegendBlock(importedBlockConfig, [layerBlueprint]);

        let position = 0;
        // find an appropriate spot in a auto legend;
        if (pos) {   // If the order from bookmark exists
            position = pos;
        } else if (configService.getSync.map.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE) {
            position = legendBlocks.entries.findIndex(block =>
                sortGroups[block.layerType] === sortGroups[importedLegendBlock.layerType]);

            // FIXME: there might be an error here when importing a Feature layer to a legend with only WMS and Dynamic layers; need to check more;
            // if the sort group for this layer doesn't exist, insert at the bottom of the legend
            position = position === -1 ? legendBlocks.entries.length : position;
        }

        // add the new legend block to the legend block (always to the root group)
        legendBlocks.addEntry(importedLegendBlock, position);

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
     * @return {Promise} resolving to legend block parent of block reloaded
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

        mappings.forEach(({ legendBlockId, legendBlockConfigId }) => {
            // need to find the actual legend block mapped to the legendBlock being reloaded and its parent container legendGroup
            const legendBlocks = configService.getSync.map.legendBlocks;
            const { legendBlock, legendBlockParent } = legendBlocks
                .walk((entry, index, parentEntry) =>
                    entry.id === legendBlockId ? {
                        legendBlock: entry,
                        legendBlockParent: parentEntry
                    } : null)
                .filter(a => a !== null)[0];

            // need to find the block config the legend block was made from and create a new one
            const legend = configService.getSync.map.legend;
            const legendBlockConfig = legend.root
                .walk(child =>
                    child.id === legendBlockConfigId ? child : null)
                .filter(a => a !== null)[0];

            // all controlled layer records __must__ be reloaded before the legend block is made
            // if this were to be done after, the state settings of the controlling legend block will not be applied correctly
            // (`regenerateLayerRecord` will remove the layer from the map, but it's the logic inside `_makeLegendBlock` that adds the layer back to the map)
            legendBlockConfig.controlledIds.forEach(controlledId =>
                reloadBoundLegendBlocks(controlledId));

            const reloadedLegendBlock = _makeLegendBlock(legendBlockConfig, layerBlueprintsCollection);

            const index = legendBlockParent.removeEntry(legendBlock);

            const layerRecord = layerRegistry.getLayerRecord(legendBlockConfig.layerId);

            if (!promise) { // ensure only one promise is created
                // need time to reload children for Dynamic layers
                promise = common.$q((resolve, reject) => {
                    layerRecord.addStateListener(_onLayerRecordLoad);

                    function _onLayerRecordLoad(state) {
                        // add back entry
                        if (state === 'rv-loaded' || state === 'rv-error') {
                            layerRecord.removeStateListener(_onLayerRecordLoad);

                            _boundingBoxRemoval(legendBlock);

                            legendBlockParent.addEntry(reloadedLegendBlock, index);
                        }

                        if (state === 'rv-loaded') {
                            resolve(legendBlockParent);
                        } else if (state === 'rv-error') {
                            reject(layerRecord.name);
                        }
                    }
                });
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
            .walk((entry, index, parentEntry) =>
                entry === legendBlock ? parentEntry : null)
            .filter(a => a !== null)[0];

        // TODO: instead of removing the legend block form the selector, just hide it with some css
        const index = legendBlockParent.removeEntry(legendBlock);

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

            // check if any other blocks reference this layer record
            // if none found, it's safe to remove the layer record
            const isSafeToRemove = legendBlocks
                .walk(entry => entry.layerRecordId === legendBlock.layerRecordId)
                .filter(a => a)
                .length === 0;

            if (isSafeToRemove) {
                layerRegistry.removeLayerRecord(legendBlock.layerRecordId);
            }

            // remove any bounding box layers associated with this legend block
            _boundingBoxRemoval(legendBlock);
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
            layerRegistry.removeBoundingBoxRecord(`${legendBlock.id}_bbox`);
        } else if (legendBlock.blockType === LegendBlock.TYPES.GROUP) {
            legendBlock.entries.forEach(entry => layerRegistry.removeBoundingBoxRecord(`${entry.id}_bbox`));
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
                    controlled: blockConfig.controlledIds.map(id =>
                        _getLayerBlueprint(id))
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

            layerConfig.layerEntries.forEach(entry => (entry.cachedRefreshInterval = (entry.refreshInterval = layerConfig.refreshInterval)));

            const groupDefaults = ConfigObject.DEFAULTS.legend[ConfigObject.TYPES.legend.GROUP];

            // convention:
            // variable names ending in `source` are raw JSON objects
            // variable names ending in `config` are typed objects

            // this will load the layer record onto the map, but only need the root proxy of a dynamic layer to catch if it errors on initial loading
            const rootProxy = _getLegendBlockProxy(blueprints.main);
            const rootProxyWrapper = new LegendBlock.ProxyWrapper(rootProxy, layerConfig);
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

            legendMappings[layerConfig.id].push({
                legendBlockId: legendBlockGroup.id,
                legendBlockConfigId: blockConfig.id
            });

            // wait for the dynamic layer record to load to get its children
            const layerRecord = layerRegistry.getLayerRecord(blockConfig.layerId);

            // TODO: there is a potential for race condition if a listener is set too late
            layerRecord.addStateListener(_onLayerRecordLoad);

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
                        legendBlock.applyInitialStateSettings();

                        legendBlockGroup.addEntry(legendBlock);
                    })

                    // apply group settings to the newly added controlled entries so any settings modified by the user
                    // while the controlled layers were loading would apply on top as well
                    legendBlockGroup.synchronizeControlledEntries();
                }));

            const meetsCollapseCondition = layerConfig.layerEntries
                .filter(layerEntry => !layerEntry.stateOnly)
                .length === 1;

            if (layerConfig.singleEntryCollapse && meetsCollapseCondition) {
                legendBlockGroup.collapsed = true;
            } else {
                // if collapse is not allowed, update the initial config value
                layerConfig.singleEntryCollapse = false;
            }

            return legendBlockGroup;

            /**
             * A helper function to handle layerRecord state change. On loaded, it create child LegendBlocks for the dynamic layer and
             * adds them to the created LegendBlock.GROUP to be displayed in the UI (following any hierarchy provided). Removes listener after that.
             *
             * @function _onLayerRecordLoad
             * @private
             * @param {String} state the current state of the layerRecord
             * @return {undefined}
             */
            function _onLayerRecordLoad(state) {
                if (state === 'rv-loaded') {
                    layerRecord.removeStateListener(_onLayerRecordLoad);

                    const tree = _createDynamicChildTree(layerRecord, layerConfig);
                    tree.forEach(item =>
                        _addChildBlock(item, legendBlockGroup));

                    legendBlockGroup.synchronizeControlledEntries();
                }
            }

            /**
             * Traverses dynamic child tree and converts them to a hierarchy of LegendBlocks.
             *
             * @function _addChildBlock
             * @private
             * @param {Object} item a tree item in the form of { layerEntry: <Number>, childs: [<Object>], proxyWrapper: { proxy: <Proxy>, layerConfig: <LayerNode> } }, `childs` and `proxyWrapper` are mutually exclusive
             * @param {LegendBlock.GROUP} parentLegendGroup parent LegendGroup block when the newly created child will be added
             */
            function _addChildBlock(item, parentLegendGroup) {
                let legendBlock;

                if (item.childs) {
                    const groupConfig = new ConfigObject.legend.EntryGroup(item.groupSource);
                    legendBlock = new LegendBlock.Group(groupConfig, rootProxyWrapper);
                    legendBlock.layerRecordId = layerConfig.id; // map all dynamic children to the block config and layer record of their root parent

                    item.childs.forEach(child =>
                        _addChildBlock(child, legendBlock));

                } else {
                    const entryConfig = new ConfigObject.legend.Entry(item);
                    legendBlock = new LegendBlock.Node(item.proxyWrapper, entryConfig);
                    legendBlock.layerRecordId = layerConfig.id; // map all dynamic children to the block config and layer record of their root parent

                    // show filter flag if there is a filter query being applied
                    legendBlock.filter = item.proxyWrapper.layerConfig.initialFilteredQuery && item.proxyWrapper.layerConfig.initialFilteredQuery !== "";
                    legendBlock.applyInitialStateSettings();
                }

                parentLegendGroup.addEntry(legendBlock);
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
                ConfigObject.DEFAULTS.layer[Geo.Layer.Types.ESRI_DYNAMIC].child);

            const groupDefaults = ConfigObject.DEFAULTS.legend[ConfigObject.TYPES.legend.GROUP];

            layerRecord.derivedChildConfigs = [];
            const tree = layerRecord.getChildTree();
            tree.forEach(treeChild =>
                _createDynamicChildLegendBlock(treeChild, layerConfig.source));

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

                if (treeChild.childs) {

                    const originalSource = angular.merge({}, derivedLayerEntryConfig.source);

                    if (!layerConfig.isResolved) {
                        // converting a child source config into a group source config;
                        // for that we need to filter out `controls` array, add `name` and empty `children` array
                        const derivedChildGroupSource = angular.extend({},
                            originalSource,
                            {
                                children: [],
                                controls: common.intersect(
                                    originalSource.controls,
                                    groupDefaults.controls
                                ),
                                disabledControls: common.intersect(
                                    originalSource.disabledControls,
                                    groupDefaults.controls),
                                userDisabledControls: common.intersect(
                                    originalSource.userDisabledControls,
                                    groupDefaults.controls
                                ),
                                name: treeChild.name
                            });

                        // convert and store at this point; pass derivedGroupSource as source for LegendGroup
                        derivedLayerEntryConfig = new ConfigObject.layers.DynamicLayerEntryNode(
                            derivedChildGroupSource, true);
                    }

                    treeChild.groupSource = derivedLayerEntryConfig.source;

                    treeChild.childs.forEach(subTreeChild =>
                        _createDynamicChildLegendBlock(subTreeChild, originalSource));


                } else {
                    const mainProxy = layerRecord.getChildProxy(treeChild.entryIndex);
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
                    let index = layerConfig.layerEntries.findIndex(entry =>
                        entry.index === layerEntryConfig.index);

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

                    const layerEntryConfig = layerConfig.layerEntries.find(entry =>
                        entry.index === treeChild.entryIndex) || defaultLayerEntryConfig;

                    if (layerConfig.isResolved) {
                        return layerEntryConfig;
                    }

                    // `layerEntryConfig` might have some controls and states specified;
                    // apply immediate parent state (which can be root) and child default values
                    const derivedChildLayerConfigSource = ConfigObject.applyLayerNodeDefaults(
                        layerEntryConfig.source,
                        dynamicLayerChildDefaults,
                        parentLayerConfigSource);

                    // dynamic children might not support opacity if the layer is not a true dynamic layer
                    // in such cases the opacity control is user disabled for all children and opacity of the whole layer should be changed at the root
                    // in single entry collapse cases, the root is hidden, and opacity control is left user enabled at the top single entry; all subsequent children are user disabled as usual
                    if (!layerRecord.isTrueDynamic &&
                        !(layerConfig.singleEntryCollapse &&
                        derivedChildLayerConfigSource.index === layerConfig.layerEntries[0].index)) {

                        derivedChildLayerConfigSource.userDisabledControls.push('opacity');
                        derivedChildLayerConfigSource.userDisabledControls.push('interval');
                    }

                    const derviedChildLayerConfig = new ConfigObject.layers.DynamicLayerEntryNode(
                        derivedChildLayerConfigSource, true);

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
            const mainProxy = _getLegendBlockProxy(blueprints.main, blockConfig);

            // all wms layer default to image-style symbology, regardless of what the config says
            if (layerConfig.layerType === Geo.Layer.Types.OGC_WMS) {
                blockConfig.symbologyRenderStyle = ConfigObject.legend.Entry.IMAGES;

                layerConfig.layerEntries.forEach(entry => (entry.cachedStyle = entry.currentStyle))
            }

            layerConfig.cachedRefreshInterval = layerConfig.refreshInterval;

            const proxyWrapper = new LegendBlock.ProxyWrapper(mainProxy, layerConfig);

            const node = new LegendBlock.Node(proxyWrapper, blockConfig);

            // map this legend block to the layerRecord
            node.layerRecordId = layerConfig.id;

            // show filter flag if there is a filter query being applied
            node.filter = layerConfig.initialFilteredQuery && layerConfig.initialFilteredQuery !== "";

            legendMappings[layerConfig.id].push({
                legendBlockId: node.id,
                legendBlockConfigId: blockConfig.id
            });

            const layerRecord = layerRegistry.getLayerRecord(blockConfig.layerId);
            layerRecord.addStateListener(_onLayerRecordLoad);

            // handling controlled layers by getting their proxies and adding them as controlled proxies to the legend node
            blueprints.controlled.forEach(blueprint =>
                _getControlledLegendBlockProxy(blueprint).then(proxyWrappers =>
                    proxyWrappers.forEach(proxyWrapper => {
                        node.addControlledProxyWrapper(proxyWrapper);

                        // reapply state setting to the node so any settings changed by the user will apply to the newly added controlled proxy (this is possible if the controlled is a dynamic layer and there is a lag when fetching its child proxies)
                        node.synchronizeControlledProxyWrappers();
                    })
                ));

            return node;

            /**
             * A helper function to handle layerRecord state change. On loaded, it applies states setting to the legend node.
             *
             * @function _onLayerRecordLoad
             * @private
             * @param {String} state the current state of the layerRecord
             * @return {undefined}
             */
            function _onLayerRecordLoad(state) {
                if (state === 'rv-loaded') {
                    layerRecord.removeStateListener(_onLayerRecordLoad);

                    // this is the first chance to properly create bounding box for this legend node
                    // since it's created on demand and cannot be created by geoapi when creating layerRecord
                    // need to read the layer config state here and initialize the bounding box manually when the layer loads
                    // Not all state is applied to the layer record inside geoApi;
                    // as a result, legend service reapplies all the state to all legend blocks after layer record is loaded
                    node.applyInitialStateSettings();
                }
            }
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

            blockConfig.exclusiveVisibility.forEach(childConfig => {
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

            const layerRecord = layerRegistry.makeLayerRecord(blueprint);
            const layerConfig = blueprint.config;
            layerRegistry.loadLayerRecord(layerRecord.config.id);

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
            disabledOptions.state.forEach(stateName =>
                (layerConfig.state[stateName] = false));

            // controlled layers are not supposed to have hovertips
            layerConfig.hovertipEnabled = false;

            let proxyPromise;

            if (blueprint.config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                proxyPromise = common.$q(resolve => {
                    layerRecord.addStateListener(_onLayerRecordLoad);

                    function _onLayerRecordLoad(state) {
                        if (state === 'rv-loaded') {

                            layerRecord.removeStateListener(_onLayerRecordLoad);
                            // tree consists of objects with entryIndex and its proxy wrapper,
                            // for controlledLayers only proxyWrappers are needed
                            const tree = _createDynamicChildTree(layerRecord, layerConfig);
                            const flatTree = _flattenTree(tree).map(item =>
                                item.proxyWrapper);

                            resolve(flatTree);
                        }
                    }
                });

            } else {
                const proxy = layerRecord.getProxy();
                const proxyWrapper = new LegendBlock.ProxyWrapper(proxy, layerConfig);

                proxyPromise = common.$q.resolve([proxyWrapper]);
            }

            return proxyPromise;

            function _flattenTree(tree) {
                const result = [].concat.apply([], tree.map(item => {
                    if (item.childs) {
                        // when flattening the tree, the groups are discarded as they will not be used
                        return _flattenTree(item.childs);
                    } else {
                        return item;
                    }
                }));

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
         * @return {Proxy} a layers proxy object
         */
        function _getLegendBlockProxy(blueprint) {
            // hidden legend blocks can't have hover tooltips or query enabled on the layers
            if (blockConfig.hidden) {
                blueprint.config.state.query = false;
            }

            const layerRecord = layerRegistry.makeLayerRecord(blueprint);
            layerRegistry.loadLayerRecord(layerRecord.config.id);

            let proxy;

            if (blockConfig.entryIndex) {
                proxy = layerRecord.getChildProxy(blockConfig.entryIndex);
            } else {
                proxy = layerRecord.getProxy();
            }

            return proxy;
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
            const blueprint = layerBlueprints.find(blueprint =>
                blueprint.config.id === id);

            // TODO: this should return something meaningful for info sections and maybe sets?
            return blueprint;
        }
    }
}
