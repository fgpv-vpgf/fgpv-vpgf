/* global RV */
(() => {
    'use strict';

    /*const LEGEND = {
        types: {
            STRUCTURED: 'structured',
            AUTOPOPULATE: 'autopopulate'
        },
        blockTypes: {
            INFO: 'legendInfo',
            NODE: 'legendNode',
            GROUP: 'legendGroup',
            SET: 'legendSet'
        }
    };*/

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

    function legendServiceFactory($q, Geo, ConfigObject, configService, LegendBlock, LayerBlueprint, layerRegistry, common) {

        const service = {
            constructLegend,
            importLayer
        };

        return service;

        /***/

        // rename: construct config legend
        function constructLegend(layerDefinitions, legendStructure) {
            // all layer defintions are passed as config fragments - turning them into layer blueprints
            const layerBluePrints = layerDefinitions.map(layerDefinition =>
                new LayerBlueprint.service(layerDefinition));

            // in structured legend, the legend's root is actually a group, although it's not visible
            return _makeLegendBlock(legendStructure.root, layerBluePrints);

        }

        function importLayer(layerBlueprint, typedMap) {

            // when adding a layer through the layer loader, set symbology render style as images for wms;
            // TODO: this can potentially move to blueprint code
            const entryConfigObject = {
                layerId: layerBlueprint.config.id,
                userAdded: true,
                symbologyRenderStyle: layerBlueprint.config.layerType === Geo.Layer.Types.OGC_WMS ?
                    ConfigObject.legend.Entry.IMAGES :
                    ConfigObject.legend.Entry.ICONS
            };

            const blockConfig = new ConfigObject.legend.Entry(entryConfigObject);

            const legendBlock = _makeLegendBlock(blockConfig, [layerBlueprint]);
            configService.getSync.map.legendBlocks.addEntry(legendBlock);

            return legendBlock;

            // TODO: this a hacky way to get it working for now; needs rethinking
        }

        /**
         * Recursively turns legend entry and group config objects into UI LegendBlock components.
         *
         * @function _makeLegendBlock
         * @private
         * @param {Object} blockConfig
         * @param {Array} layerBlueprints
         * @return {LegendBlcok} the resulting LegendBlock object
         */
        function _makeLegendBlock(blockConfig, layerBlueprints) {
            const legendTypes = ConfigObject.TYPES.legend;

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
                        return _makeDynamicGroupBlock(blockConfig, nodeBlueprints);
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

                const groupDefaults = ConfigObject.DEFAULTS.legend[ConfigObject.TYPES.legend.GROUP];

                // convention:
                // variable names ending in `source` are raw JSON objects
                // variable names ending in `config` are typed objects

                // this will load the layer record onto the map, but we don't need the root proxy of a dynamic layer as it's not used
                _getLegendBlockProxy(blueprints.main);

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
                const legendBlockGroup = new LegendBlock.Group(derivedEntryGroupConfig);

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
                            const legendBlock = new LegendBlock.Node(proxyWrapper, entryConfig, true);
                            legendBlock.reApplyStateSettings();

                            legendBlockGroup.addEntry(legendBlock);
                        })

                        legendBlockGroup.reApplyStateSettings();
                    }));

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

                        legendBlockGroup.reApplyStateSettings();
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
                        legendBlock = new LegendBlock.Group(groupConfig);

                        item.childs.forEach(child =>
                            _addChildBlock(child, legendBlock));

                    } else {
                        const entryConfig = new ConfigObject.legend.Entry(item);
                        legendBlock = new LegendBlock.Node(item.proxyWrapper, entryConfig);
                        legendBlock.reApplyStateSettings();
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
             * @return {Object}
             */
            function _createDynamicChildTree(layerRecord, layerConfig) {
                const dynamicLayerChildDefaults = angular.copy(
                    ConfigObject.DEFAULTS.layer[Geo.Layer.Types.ESRI_DYNAMIC].child);

                const groupDefaults = ConfigObject.DEFAULTS.legend[ConfigObject.TYPES.legend.GROUP];

                // dynamic children might not support opacity if the layer is not a true dynamic layer
                // TODO: allow for an optional description why the control is disabled
                if (!layerRecord.isTrueDynamic) {
                    dynamicLayerChildDefaults.userDisabledControls.push('opacity');
                }

                const tree = layerRecord.getChildTree();
                tree.forEach(treeChild =>
                    _createDynamicChildLegendBlock(treeChild, layerConfig.source));

                return tree;

                /**
                 * Recursively parses individual children of the dynamic layer record child tree.
                 * If a child is a leaf, fetches it's proxy object and derives a layer config for that leaf. Proxy wrapper is stored directly on the child itself.
                 * If a child is a group, derives the legend block config for this group, and runs itself on its children. Block config is stored on the child itself.
                 *
                 * @function _createDynamicChildLegendBlock
                 * @private
                 * @param {Object} treeChild a tree child object of the form { layerEntry: <Number>, childs: [<treechild>], name: <String> }, `childs` and `name` present only on groups
                 * @param {Object} parentLayerConfigSource
                 */
                function _createDynamicChildLegendBlock(treeChild, parentLayerConfigSource) {
                    let childLegendBlock;

                    // get the initial layerEntry config from the layer record config, or
                    // create a source object if config object can't be found (this will happen when the dynamic subgroups are expanded)
                    const layerEntryConfig = layerConfig.layerEntries.find(entry =>
                        entry.index === treeChild.entryIndex) || { source: { entryIndex: treeChild.entryIndex } };

                    // `layerEntryConfig` might have some controls and states specified;
                    // apply immediate parent state (which can be root) and child default values
                    const derivedChildLayerConfigSource = ConfigObject.applyLayerNodeDefaults(
                        layerEntryConfig.source, dynamicLayerChildDefaults, parentLayerConfigSource);

                    if (treeChild.childs) {

                        // converting a child source config into a group source config;
                        // for that we need to filter out `controls` array, add `name` and empty `children` array
                        const derivedChildGroupConfigSource = angular.merge({},
                            derivedChildLayerConfigSource,
                            {
                                children: [],
                                controls: common.intersect(
                                    derivedChildLayerConfigSource.controls,
                                    groupDefaults.controls
                                ),
                                disabledControls: common.intersect(
                                    derivedChildLayerConfigSource.disabledControls,
                                    groupDefaults.controls),
                                name: treeChild.name
                            });

                        treeChild.groupSource = derivedChildGroupConfigSource;

                        treeChild.childs.forEach(subTreeChild =>
                            _createDynamicChildLegendBlock(subTreeChild, derivedChildLayerConfigSource));
                    } else {
                        const mainProxy = layerRecord.getChildProxy(treeChild.entryIndex);
                        const derviedChildLayerConfig = new ConfigObject.layers.DynamicLayerEntryNode(
                            derivedChildLayerConfigSource);
                        const proxyWrapper = new LegendBlock.ProxyWrapper(mainProxy, derviedChildLayerConfig);

                        treeChild.proxyWrapper = proxyWrapper;
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

                const proxyWrapper = new LegendBlock.ProxyWrapper(mainProxy, layerConfig);

                const node = new LegendBlock.Node(proxyWrapper, blockConfig);

                const layerRecord = layerRegistry.getLayerRecord(blockConfig.layerId);
                layerRecord.addStateListener(_onLayerRecordLoad);

                // handling controlled layers by getting their proxies and adding them as controlled proxies to the legend node
                blueprints.controlled.forEach(blueprint =>
                    _getControlledLegendBlockProxy(blueprint).then(proxyWrappers =>
                        proxyWrappers.forEach(proxyWrapper => {
                            node.addControlledProxyWrapper(proxyWrapper);

                            // reapply state setting to the node so any settings changed by the user will apply to the newly added controlled proxy (this is possible if the controlled is a dynamic layer and there is a lag when fetching its child proxies)
                            node.reApplyStateSettings();
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
                        node.reApplyStateSettings();
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

                // for all controlled layers, disable query and boundingbox controls
                ['query', 'boundingBox'].forEach(controlName => {
                    if (layerConfig.disabledControls.indexOf(controlName) === -1) {
                        layerConfig.disabledControls.push(controlName);
                    }
                });

                let proxyPromise;

                if (blueprint.config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    proxyPromise = $q(resolve => {
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

                    proxyPromise = $q.resolve([proxyWrapper]);
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

    _legendServiceFactory();

    function _legendServiceFactory($translate, $http, $q, $timeout, gapiService, Geo, legendEntryFactory) {

        const legendSwitch = {
            structured: structuredLegendService,
            autopopulate: autoLegendService
        };

        return (config, ...args) => legendSwitch[config.legend.type](config, ...args);

        /**
         * Constrcuts and maintains autogenerated legend.
         * @function autoLegendService
         * @private
         * @param  {Object} config current config
         * @param  {Object} layerRegistry instance of `layerRegistry`
         * @return {Object}        instance of `legendService` for autogenerated legend
         */
        function autoLegendService() { // config, layerRegistry) { // FIXME: remove later if not needed
            // used in default names for service which do not provide one; it resets every time the map is reloaded (bookmark, language switch, projection switch), so it doesn't grow to ridiculous numbers
            let unnamedServiceCounter = 0;

            // maps layerTypes to layer item generators
            // TODO we may want to revisit this since all the keys can be replaced by constant references
            const layerTypeGenerators = {
                esriDynamic: dynamicGenerator,
                esriFeature: featureGenerator,
                esriImage: imageGenerator,
                esriTile: tileGenerator,
                ogcWms: wmsGenerator
            };

            const service = {
                /**
                 * This is legend's invisible root group; to be consumed by toc
                 * @var legend
                 */
                legend: legendEntryFactory.entryGroup(),

                addLayer,
                addPlaceholder
            };

            return service;

            /***/

            /**
             * Parses a dynamic layer object and creates a legend item (with nested groups and symbology).
             * For a dynamic layer, there are two visibility functions:
             *     - `setVisibility`: https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisibility
             *      sets visibility of the whole layer; if this is set to false, using `setVisibleLayers` will not change anything.
             *
             *  - `setVisibleLayers`: https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisiblelayers
             *      sets visibility of sublayers;
             *
             * A tocEntry for a dynamic layer contains subgroups and leaf nodes, each one with a visibility toggle.
             *  - User clicks on leaf's visibility toggle:
             *      toggle visibility of the leaf's layer item.
             *      notify the root group of this dynamic layer.
             *      walk root's children to find out which leaves are visible, omitting any subgroups.
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer.
             *
             *  - User clicks on subgroup's visibility toggle:
             *      toggle visibility of the subgroup item.
             *      toggle all its children (prevent children from notifying the root when they are toggled).
             *      notify the root group of this dynamic layer.
             *      walk root's children to find out which leaves are visible, omitting any subgroups.
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer.
             *
             *  - User clicks on root's visibility toggle:
             *      toggle all its children (prevent children from notifying the root when they are toggled).
             *      walk root's children to find out which leaves are visible, omitting any subgroups.
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer.
             *
             * @function dynamicGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function dynamicGenerator(layer) {
                const state = legendEntryFactory.dynamicEntryMasterGroup(layer.config, layer, false);
                layer.legendEntry = state;

                // assign feature counts and symbols only to active sublayers
                state.walkItems(layerEntry => {
                    // get the legend from the attrib bundle, use it to derive the symbol
                    layer._attributeBundle[layerEntry.featureIdx.toString()].layerData.then(ld => {

                        if (ld.supportsFeatures) {
                            // since a geoApi generated legend only has one element, we can omit searching layers[] for a match
                            applySymbology(layerEntry, ld.legend.layers[0]);

                            getServiceFeatureCount(`${state.url}/${layerEntry.featureIdx}`).then(count =>
                                // FIXME _layer reference is bad
                                // FIXME geometryType is undefined for dynamic layer children right now
                                applyFeatureCount(layer._layer.geometryType, layerEntry, count));
                        } else {
                            // no features.  show "0 features"
                            applyFeatureCount('generic', layerEntry, 0);

                            // get our legend from the server (as we have no local renderer)
                            gapiService.gapi.symbology.mapServerToLocalLegend(state.url, layerEntry.featureIdx)
                                .then(legendData => {
                                    applySymbology(layerEntry, legendData.layers[0]);
                                });

                            // this will remove the click handler from the legend entry
                            // TODO suggested to make a new state for legend items that makes them
                            // non-interactable until everything in them has loaded
                            delete layerEntry.options.data;
                        }
                    });
                });

                return state;
            }

            /**
             * Parses a tile layer object and creates a legend item (with nested groups and symbology).
             * Uses the same logic as dynamic layers to generate symbology hierarchy.
             * @function tileGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function tileGenerator(layer) {
                // show icon if map projection does not match own projection
                if (layer._layer._map.spatialReference.wkid !== layer.spatialReference.wkid) {
                    layer.config.flags.wrongprojection.visible = true;
                }

                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                layer.legendEntry = state;

                // get our legend from the server (as we have no local renderer)
                // FIXME in legend-entry.service, function SINGLE_ENTRY_ITEM.init, there is a FIXME to prevent
                // the stripping of the final part of the url for non-feature layers.
                // for now, we correct the issue here. when it is fixed, this function should be re-adjusted
                gapiService.gapi.symbology.mapServerToLocalLegend(`${state.url}/${state.featureIdx}`).then(legendData =>
                    applySymbology(state, legendData.layers[0]));

                return state;
            }

            /**
             * Parses feature layer object and create a legend entry with symbology.
             * @function featureGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function featureGenerator(layer) {
                // generate toc entry
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                layer.legendEntry = state;

                if (typeof state.url !== 'undefined') {
                    // assign feature count
                    // FIXME _layer call is bad
                    getServiceFeatureCount(`${state.url}/${state.featureIdx}`).then(count =>
                        applyFeatureCount(layer._layer.geometryType, state, count));
                } else {
                    applyFeatureCount(layer._layer.geometryType, state, layer._layer.graphics.length);
                }

                // FIXME _attributeBundle call is probably bad
                // get the legend from the attrib bundle, use it to derive the symbol
                layer._attributeBundle[state.featureIdx].layerData.then(ld => {
                    // since a geoApi generated legend only has one element, we can omit searching layers[] for a match
                    applySymbology(state, ld.legend.layers[0]);
                });

                return state;
            }

            /**
             * Parses esri image layer object and create a legend entry with symbology.
             * @function imageGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function imageGenerator(layer) {
                // generate toc entry
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                layer.legendEntry = state;

                // get our legend from the server (as we have no local renderer)
                // image server uses 0 as default layer id
                // FIXME in legend-entry.service, function SINGLE_ENTRY_ITEM.init, there is a FIXME to prevent
                // the stripping of the final part of the url for non-feature layers.
                // for now, we correct the issue here. when it is fixed, this function should be re-adjusted
                gapiService.gapi.symbology.mapServerToLocalLegend(`${state.url}/${state.featureIdx}`, 0)
                    .then(legendData => {
                        applySymbology(state, legendData.layers[0]);
                    });

                return state;
            }

            /**
             * Searches for a layer title defined by a wms.
             * @function getWMSLayerTitle
             * @private
             * @param  {Object} wmsLayer     esri layer object for the wms
             * @param  {String} wmsLayerId   layers id as defined in the wms (i.e. not wmsLayer.id)
             * @return {String}              layer title as defined on the service, '' if no title defined
             */
            function getWMSLayerTitle(wmsLayer, wmsLayerId) {
                // TODO include this in geoAPI after refactor?

                // crawl esri layerInfos (which is a nested structure),
                // returns sublayer that has matching id or null if not found.
                // written as function to allow recursion
                const crawlSubLayers = (subLayerInfos, wmsLayerId) => {
                    let targetEntry = null;

                    // we use .some to allow the search to stop when we find something
                    subLayerInfos.some(layerInfo => {
                        // wms ids are stored in .name
                        if (layerInfo.name === wmsLayerId) {
                            // found it. save it and exit the search
                            targetEntry = layerInfo;
                            return true;
                        } else if (layerInfo.subLayers) {
                            // search children. if in children, will exit search, else will continue
                            return crawlSubLayers(layerInfo.subLayers, wmsLayerId);
                        } else {
                            // continue search
                            return false;
                        }
                    });

                    return targetEntry;
                };

                // init search on root layerInfos, then process result
                const match = crawlSubLayers(wmsLayer.layerInfos, wmsLayerId);
                if (match && match.title) {
                    return match.title;
                } else {
                    return ''; // falsy!
                }
            }

            /**
             * Parses WMS layer object and create a legend entry with symbology.
             * @function wmsGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function wmsGenerator(layer) {
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                state.symbology = gapiService.gapi.layer.ogc
                    .getLegendUrls(layer._layer, state.layerEntries.map(le => le.id))
                    .map((imageUri, idx) => {

                        const symbologyItem = {
                            name: null,
                            svgcode: null
                        };

                        // config specified name || server specified name || config id
                        const name = state.layerEntries[idx].name ||
                            getWMSLayerTitle(layer._layer, state.layerEntries[idx].id) ||
                            state.layerEntries[idx].id;

                        gapiService.gapi.symbology.generateWMSSymbology(name, imageUri).then(data => {
                            symbologyItem.name = data.name;
                            symbologyItem.svgcode = data.svgcode;
                        });

                        return symbologyItem;
                    });
                layer.legendEntry = state;

                return state;
            }

            /**
             * Add a placeholder for the provided layer.
             *
             * @function addPlaceholder
             * @param {Object} layerRecord object from `layerRegistry` `layers` object
             */
            function addPlaceholder(layerRecord) {
                // set a default service name if one is not provided in the config: fgpv-vpgf/fgpv-vpgf#1248
                if (typeof layerRecord.config.name !== 'string') {
                    layerRecord.config.name = $translate.instant(
                        'toc.layer.unnamed',
                        { count: ++unnamedServiceCounter });
                }

                // TODO: move this to LegendEntry when it is refactored
                const entry = legendEntryFactory.placeholderEntryItem(layerRecord.config, layerRecord);
                layerRecord.legendEntry = entry;

                // find a position where to insert new placeholder based on its sortGroup value
                let position = service.legend.items.findIndex(et => et.sortGroup > entry.sortGroup);
                position = position !== -1 ? position : undefined;
                position = service.legend.add(entry, position);

                RV.logger.log('legendService', `inserting placeholder with name ` +
                    `*${entry.name}* into position _${position}_`);
                const listener = state => {
                    RV.logger.info('legendService', `placeholder listener fired with state ` +
                        `${state} on layerReord id ${layerRecord.layerId}`);
                    if (!entry.removed && state === Geo.Layer.States.LOADED) {
                        layerRecord.removeStateListener(listener);
                        entry.unbindListeners();
                        // swap the placeholder with the real legendEntry
                        const index = service.legend.remove(entry);
                        addLayer(layerRecord, index);
                    }
                };
                layerRecord.addStateListener(listener);

                return position;
            }

            /**
             * Add a provided layer to the appropriate group.
             *
             * TODO: hide groups with no layers.
             * @function addLayer
             * @param {Object} layer object from `layerRegistry` `layers` object
             * @param {Number} index position to insert layer into the legend
             */
            function addLayer(layer, index) {
                const layerType = layer.config.layerType;
                const entry = layerTypeGenerators[layerType](layer);

                // TODO: move somewhere more appropriate
                // make top level legend entries reorderable via keyboard
                entry.options.reorder = {
                    enabled: true
                };

                RV.logger.log('legendService', `inserting legend entry with name *${entry.name}* to index _${index}_`);

                service.legend.add(entry, index);
            }
        }

        // TODO: maybe this should be split into a separate service; it can get messy otherwise in here
        function structuredLegendService() {

        }

        /**
         * Get feature count from a layer.
         * @function getServiceFeatureCount
         * @param  {String} layerUrl layer url
         * @return {Promise}          promise resolving with a feature count
         */
        function getServiceFeatureCount(layerUrl, finalTry = false) {
            return $http.jsonp(
                `${layerUrl}/query?where=1=1&returnCountOnly=true&returnGeometry=false&f=json&callback=JSON_CALLBACK`)
                .then(result => {
                    if (result.data.count) {
                        return result.data.count;
                    } else if (!finalTry) {
                        return getServiceFeatureCount(layerUrl, true);
                    } else {
                        return $translate.instant('toc.error.resource.countfailed');
                    }
                });
        }

        /**
         * Applies feature count to the toc entries.
         * @function applyFeatureCount
         * @param  {String} geometryType one of geometry types
         * @param  {Object} state legend entry object
         * @param  {Number} count  number of features in the layer
         */
        function applyFeatureCount(geometryType, state, count) {
            if (typeof geometryType === 'undefined') {
                geometryType = 'generic';
            }

            state.features = {
                count: count,
                type: geometryType,
                typeName: $translate.instant(Geo.Layer.Esri.GEOMETRY_TYPES[geometryType])
                    .split('|')[state.features.count === 1 ? 0 : 1]
            };
        }

        /**
         * Applies retrieved symbology to the layer item's state.
         * @function applySymbology
         * @param  {Object} state     layer item
         * @param  {Object} layerData data from the legend endpoint
         */
        function applySymbology(state, layerData) {
            state.symbology = layerData.legend.map(item => {

                const symbologyItem = {
                    svgcode: null,
                    name: null
                };

                // file-based layers don't have symbology labels, default to ''
                // TODO: move label defaulting to geoApi

                // legend items are promises
                item.then(data => {
                    symbologyItem.svgcode = data.svgcode;
                    symbologyItem.name = data.label || '';
                });

                return symbologyItem;
            });
        }
    }
})();
