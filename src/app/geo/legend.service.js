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

    function legendServiceFactory(Geo, ConfigObject, LegendBlock, LayerBlueprint, configService, layerRegistry, common) {

        const service = {
            contructLegend,
            getLegendBlock,

            importLayer
        };

        return service;

        /***/

        // rename: construct config legend
        function contructLegend(layerDefinitions, legendStructure) {
            // all layer defintions are passed as config fragments - turning them into layer blueprints
            const layerBluePrints = layerDefinitions.map(layerDefinition =>
                new LayerBlueprint.service(layerDefinition));

            // in structured legend, the legend's root is actually a group, although it's not visible
            const rootGroup = _makeLegendBlock(legendStructure.root, layerBluePrints);

            configService._sharedConfig_.map._legendBlocks = rootGroup;
        }

        function importLayer(layerBlueprint) {

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

            // TODO: this a hacky way to get it working for now; needs rethinking
            configService._sharedConfig_.map._legendBlocks.addEntry(legendBlock);
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
                        adjunct: blockConfig.controlledIds.map(id =>
                            _getLayerBlueprint(id))
                    };

                    const nodeProxies = _getLegendBlockProxies(blockConfig, nodeBlueprints);

                    // dynamic layers render as LegendGroup blocks; all other layers are rendered as LegendNode blocks;
                    if (nodeBlueprints.main.config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                        return _makeDynamicGroupBlock(blockConfig, nodeBlueprints.main, nodeProxies);
                    } else {
                        return _makeNodeBlock(blockConfig, nodeBlueprints.main, nodeProxies);
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
             * @param {LayerBlueprint} mainBlueprint layerBlueprint of the
             * @return {LegendBlock.GROUP} the resulting LegendBlock.GROUP object
             */
            function _makeDynamicGroupBlock(blockConfig, mainBlueprint, proxies) {
                const layerConfig = mainBlueprint.config;

                // TODO: handle adjunct proxies; they need to be converted to invisible Legendblocks and added to the group
                console.log(proxies.adjunct);

                // to create a group for a dynamic layer, create a entryGroup config object by using properties
                // from dynamic layer definition config object
                const derivedEntryGroupConfig = {
                    name: layerConfig.name,
                    children: [],
                    controls: layerConfig.controls,
                    disabledControls: layerConfig.disabledControls
                };
                const entryGroup = new ConfigObject.legend.EntryGroup(derivedEntryGroupConfig);

                const legendBlockGroup = new LegendBlock.Group(entryGroup);

                // wait for the dynamic layer record to load to get its children
                const layerRecord = layerRegistry.getLayerRecord(blockConfig.layerId);

                layerRecord.addStateListener(_onLayerRecordLoad);

                const dynamicLayerChildDefaults = angular.copy(
                    ConfigObject.DEFAULTS.layer[Geo.Layer.Types.ESRI_DYNAMIC].child);

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
                        console.info('layer state:', state);

                        // dynamic children might not support opacity if the layer is not a true dynamic layer
                        // TODO: check/handle controlledIds proxies as well
                        // TODO: allow for an optional description why the control is disabled
                        if (!layerRecord.isTrueDynamic) {
                            dynamicLayerChildDefaults.userDisabledControls.push('opacity');
                        }

                        const tempEntryGroup = new ConfigObject.legend.EntryGroup({
                            children: layerRecord.getChildTree()
                        });

                        //common.$timeout(() => {
                        tempEntryGroup.children.forEach((tempEntryGroupChild, index) =>
                            _addChildBlock(tempEntryGroupChild, legendBlockGroup, layerConfig));
                        //}, 5000);

                        layerRecord.removeStateListener(_onLayerRecordLoad);
                    }
                }

                /**
                 * Traverses dynamic layerEntries and converts them to a hierarchy of LegendBlocks.
                 *
                 * @function _addChildBlock
                 * @private
                 * @param {Entry|GroupEntry} entryObject typed config objects
                 * @param {LegendBlock.GROUP} parent parent LegendBlock
                 * @param {LayerNode} parentLayerConfig typed layer config object
                 */
                function _addChildBlock(entryObject, parent, parentLayerConfig) {
                    let chilLegenddBlock;

                    // get the initial layerEntry config from the layer record config
                    const layerEntryConfig = layerConfig.layerEntries.find(entry =>
                        entry.index === entryObject.entryIndex);

                    // `layerEntryConfig` might have some controls and states specified;
                    // apply immediate parent state (which can be root) and child default values
                    const derivedChildBlockLayerConfig = ConfigObject.applyLayerNodeDefaults(
                        layerEntryConfig.source, dynamicLayerChildDefaults, parentLayerConfig);

                    if (entryObject.children) {
                        // TODO: this line might not be needed as entryObject should be typed already
                        chilLegenddBlock = new LegendBlock.Group(entryObject);

                        entryObject.children.forEach(subEntryObject =>
                            _addChildBlock(subEntryObject, chilLegenddBlock, derivedChildBlockLayerConfig));
                    } else {
                        const proxies = {
                            main: layerRecord.getChildProxy(entryObject.entryIndex),
                            adjunct: []
                        };

                        chilLegenddBlock = new LegendBlock.Node(proxies, entryObject, derivedChildBlockLayerConfig);
                        _applyState(chilLegenddBlock, derivedChildBlockLayerConfig.state);
                    }

                    parent.addEntry(chilLegenddBlock);
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
             * @return {LegendBlock.NODE} the resulting LegendBlock.NODE object
             */
            function _makeNodeBlock(blockConfig, mainBlueprint, proxies) {
                const layerConfig = mainBlueprint.config;
                const node = new LegendBlock.Node(proxies, blockConfig, layerConfig);

                const layerRecord = layerRegistry.getLayerRecord(blockConfig.layerId);
                layerRecord.addStateListener(_onLayerRecordLoad);

                return node;

                function _onLayerRecordLoad(state) {
                    if (state === 'rv-loaded') {
                        // this is the first chance to properly create bounding box for this legend node
                        // since it's created on demand and cannot be created by geoapi when creating layerRecord
                        // need to read the layer config state here and initialize the bounding box manually when the layer loads
                        // node.boundingBox = layerConfig.state.boundingBox;

                        _applyState(node, layerConfig.state);

                        layerRecord.removeStateListener(_onLayerRecordLoad);
                    }
                }
            }

            /**
             * Applies the layerConfig state to the corresponding LegendBlock.
             * Not all state is applied to the layer record inside geoApi;
             * as a result, legend service reapplies all the state to all legend blocks after layer record is loaded
             *
             * @function _applyState
             * @private
             * @param {LegendBlock} legendNode legend block to apply the supplied state to
             * @param {InitialLayerSettings} state the state to be applied to the legend block
             */
            function _applyState(legendNode, state) {
                legendNode.opacity = state.opacity;
                legendNode.visibility = state.visibility;
                // TODO: uncomment when child proxy has extent available
                // legendNode.boundingBox = state.boundingBox;
                // legendNode.query = state.query;
                // legendNode.snapshot = state.snapshot;
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
             * A helper function creating (if doesn't exist) appropriate layerRecord for a provided entry config object and returns their proxy objects.
             * Only entries (not groups or infos) can have direct proxies.
             * A config legend entry must have a main proxy, and can optionally have several adjunct proxies through `controlledIds` property.
             *
             * @function _getLegendBlockProxies
             * @private
             * @param {Object} blockConfig legend entry config object
             * @return {Object} an object containing related proxies in the form of { main: <LayerProxy>, adjunct: [<LayerProxy>] }
             */
            function _getLegendBlockProxies(blockConfig, { main: mainBlueprint, adjunct: adjunctBlueprints }) {
                const mainLayerRecord = layerRegistry.makeLayerRecord(mainBlueprint);
                layerRegistry.loadLayerRecord(mainBlueprint.config.id);

                let mainProxy;

                if (blockConfig.entryid) {
                    // TODO: get WMS child proxy?
                    console.log('wms child proxy, get out');
                } else if (blockConfig.entryIndex) {
                    mainProxy = mainLayerRecord.getChildProxy(blockConfig.entryIndex);
                } else {
                    mainProxy = mainLayerRecord.getProxy();
                }

                // TODO: for controlledIds (here and in the dynamic block), if the controlledId is a dynamic layer
                // instead of grabbing the top proxy, expand the list to include all the child proxies;
                // this is needed to properly propagate changes to the controlled dynamic layer

                const adjunctLayerRecords = adjunctBlueprints.map(blueprint => {
                    const layerRecord = layerRegistry.makeLayerRecord(blueprint);
                    layerRegistry.loadLayerRecord(blueprint.config.id);

                    return layerRecord;
                });

                const adjunctProxies = adjunctLayerRecords.map(layerRecord =>
                    layerRecord.getProxy());

                return {
                    main: mainProxy,
                    adjunct: adjunctProxies
                };
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

        // ???
        function getLegendBlock(id) {

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
