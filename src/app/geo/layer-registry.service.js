const THROTTLE_COUNT = 2;
const THROTTLE_TIMEOUT = 3000;

/**
 *
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

function layerRegistryFactory($rootScope, $timeout, $filter, events, gapiService, Geo, configService, tooltipService, common) {
    const service = {
        getLayerRecord,
        makeLayerRecord,
        loadLayerRecord,
        regenerateLayerRecord,
        removeLayerRecord,

        getBoundingBoxRecord,
        makeBoundingBoxRecord,
        removeBoundingBoxRecord,

        synchronizeLayerOrder,
        getRcsLayerIDs
    };

    const ref = {
        mapLoadingWaitHandle: null,

        loadingQueue: [],
        loadingCount: 0,

        refreshAttributes: {}
    };

    /**
     * Finds and returns the layer record using the id specified.
     *
     * @function getLayerRecord
     * @param {Number} id the id of the layer record to be returned
     * @return {LayerRecord} layer record with the id specified; undefined if not found
     */
    function getLayerRecord(id) {
        const layerRecords = configService.getSync.map.layerRecords;

        return layerRecords.find(layerRecord =>
            layerRecord.layerId === id);
    }

    /**
     * Creates the layer record from the provided layerBlueprint, stores it in the shared config and returns the results.
     *
     * @function makeLayerRecord
     * @param {LayerBlueprint} layerBlueprint layerBlueprint used for creating the layer record
     * @return {LayerRecord} created layerRecord
     */
    function makeLayerRecord(layerBlueprint) {
        const layerRecords = configService.getSync.map.layerRecords;

        let layerRecord = getLayerRecord(layerBlueprint.config.id);

        if (!layerRecord) {
            layerRecord = layerBlueprint.generateLayer();
            layerRecords.push(layerRecord);
        }

        ref.refreshAttributes[layerRecord.layerId] = _attribsInvalidation(layerRecord);

        /**
         * @function _attribsInvalidation
         * @private
         * @param {LayerRecord} layerRecord a layer record to set the interval of deleting attributes
         * @return {Function} a function to invalidate pre-loaded attributes after certain time period
         */
        function _attribsInvalidation(layerRecord) {
            const refreshInterval = layerBlueprint.config.refreshInterval;
            let updateAttributes;
            if (refreshInterval) {
                updateAttributes = common.$interval(() => {
                    layerRecord.cleanUpAttribs();
                }, refreshInterval * 60000);
            }

            return updateAttributes;
        }

        return layerRecord;
    }

    /**
     * Generates a new layer record from the provided layer blueprint and replaces the previously generated layer record (keeping original position).
     * This will also remove the corresponding layer from the map, but will not trigger the loading of the new layer.
     *
     * @function regenerateLayerRecord
     * @param {LayerBlueprint} layerBlueprint the original layerBlueprint of the layer record to be regenerated
     */
    function regenerateLayerRecord(layerBlueprint) {
        const map = configService.getSync.map.instance;
        const layerRecords = configService.getSync.map.layerRecords;

        let layerRecord = getLayerRecord(layerBlueprint.config.id);
        const index = layerRecords.indexOf(layerRecord);

        if (index !== -1) {
            common.$interval.cancel(ref.refreshAttributes[layerRecord.layerId]);
            map.removeLayer(layerRecord._layer);
            layerRecord = layerBlueprint.generateLayer();
            layerRecords[index] = layerRecord;
        }
    }

    /**
     * Removes the layer record with the specified id from the map and from the layer record collection.
     *
     * @function removeLayerRecord
     * @param {String} id a layer record id to be removed from the map
     * @return {Number} index of the removed layer record or -1 if the record was not found in the collection
     */
    function removeLayerRecord(id) {
        const map = configService.getSync.map.instance;
        const layerRecords = configService.getSync.map.layerRecords;

        let layerRecord = getLayerRecord(id);
        const index = layerRecords.indexOf(layerRecord);

        if (index !== -1) {
            common.$interval.cancel(ref.refreshAttributes[layerRecord.layerId]);
            layerRecords.splice(index, 1);
            map.removeLayer(layerRecord._layer);
        }

        return index;
    }

    /**
     * Finds a layer record with the specified id and adds it to the map.
     * If the layer is alredy loaded or is in the loading queue, it will not be added the second time.
     *
     * @param {Number} id layer record id to load on the map
     * @return {Boolean} true if the layer record existed and was added to the map; false otherwise
     */
    function loadLayerRecord(id) {
        const layerRecord = getLayerRecord(id);
        const map = configService.getSync.map.instance;

        if (layerRecord) {
            const alreadyLoading = ref.loadingQueue.some(lr =>
                lr === layerRecord);
            const alreadyLoaded = map.graphicsLayerIds.concat(map.layerIds)
                .indexOf(layerRecord.config.id) !== -1;

            if (alreadyLoading || alreadyLoaded) {
                return false;
            }

            ref.loadingQueue.push(layerRecord);
            _loadNextLayerRecord();

            return true;
        } else {
            return false;
        }
    }

    /**
     * Loads a LayerRecord from the `loadingQueue` by adding it to the map. If the throttle count is reached, waits until some of the currently loading layers finish (or error.)
     *
     * @function _loadNextLayerRecord
     * @private
     */
    function _loadNextLayerRecord() {
        const mapConfig = configService.getSync.map;
        if (!mapConfig.isLoaded) {
            _waitForMapLoad();
            return;
        }

        if (ref.loadingCount >= THROTTLE_COUNT || ref.loadingQueue.length === 0) {
            return;
        }

        const mapBody = mapConfig.instance;
        const layerRecord = ref.loadingQueue.shift();

        let isRefreshed = false;
        layerRecord.addStateListener(_onLayerRecordLoad);

        mapBody.addLayer(layerRecord._layer);
        ref.loadingCount ++;

        // HACK: for a file-based layer, call onLoad manually since such layers don't emmit events
        if (layerRecord._layer.loaded) {
            isRefreshed = true;
            _onLayerRecordLoad('rv-loaded');
        }

        // when a layer takes too long to load, it could be a slow service or a failed service
        // in any case, the queue will advance after THROTTLE_TIMEOUT
        // failed layers will be marked as failed when the finally resolve
        // slow layers will load on their own at some point
        const throttleTimeoutHandle = $timeout(_advanceLoadingQueue, THROTTLE_TIMEOUT);

        /**
         * Waits fro the layer to load or fail.
         *
         * // TODO: check if there is a better way to wait for layer to load than to wait for 'refresh' -> 'load' event chain
         * @function _onLayerRecordLoad
         * @private
         * @param {String} state name of the new LayerRecord state
         * @private
         */
        function _onLayerRecordLoad(state) {
            if (state === 'rv-refresh') {
                isRefreshed = true;
            } else if (
                (isRefreshed && state === 'rv-loaded') ||
                (state === 'rv-error')
            ) {
                layerRecord.removeStateListener(_onLayerRecordLoad);

                events.$broadcast(events.rvLayerRecordLoaded, layerRecord.config.id);
                $timeout.cancel(throttleTimeoutHandle);
                _setHoverTips(layerRecord);
                _advanceLoadingQueue();
            }
        }

        /**
         * Advances the loading queue and starts loading the next layer record if any is available.
         *
         * @function _advanceLoadingQueue
         * @private
         */
        function _advanceLoadingQueue() {
            synchronizeLayerOrder();
            ref.loadingCount = Math.max(--ref.loadingCount, 0);
            _loadNextLayerRecord();
        }

        /**
         * Wait for the map to finish initial load of the selected basemap.
         * Adding layers before the basemap loads, will break everything.
         *
         * @private
         * @function _waitForMapLoad
         */
        function _waitForMapLoad() {
            if (ref.mapLoadingWaitHandle) {
                return;
            }

            ref.mapLoadingWaitHandle = $rootScope.$watch(() => mapConfig.isLoaded, value => {
                if (value) {
                    ref.mapLoadingWaitHandle(); // de-register watch
                    ref.mapLoadingWaitHandle = null;
                    _loadNextLayerRecord();
                }
            });
        }
    }

    /**
     * Synchronizes the layer order as seen by the user in the layer selector and the internal layer map stack order.
     * This should be used every time a new layer is added to the map or legend nodes in the layer selector are reordered.
     *
     * @function synchronizeLayerOrder
     */
    function synchronizeLayerOrder() {
        const mapBody = configService.getSync.map.instance;
        const boundingBoxRecords = configService.getSync.map.boundingBoxRecords;
        const highlightLayer = configService.getSync.map.highlightLayer;

        // an array of layer records ordered as visible to the user in the layer selector UI component
        const layerRecordIDsInLegend = configService.getSync.map.legendBlocks
            .walk(lb => lb.layerRecordId) // get a flat list of layer record ids as they appear in UI
            .filter(id => id) // this will strip all falsy values like `undefined` and `null` since ids should be strings; filter out artificial groups that don't have ids set to null and legend info elements
            .reduce((a, b) =>
                a.concat(a.indexOf(b) < 0 ? b : []), []); // remove duplicates (dynamic group and its children with have the same layer id)

        const orderedLayerRecords = configService.getSync.map.layers
            .map(layer => layer.id)
            .filter(id => layerRecordIDsInLegend.indexOf(id) !== -1)
            .map(getLayerRecord); // get appropriate layer records

        const mapLayerStacks = {
            0: mapBody.graphicsLayerIds,
            1: mapBody.layerIds
        };

        const sortGroups = [0, 1];

        sortGroups.forEach(sortGroup =>
            _syncSortGroup(sortGroup));

        // just in case the bbox layers got out of hand,
        // push them to the bottom of the map stack (high drawing order)
        const featureStackLastIndex = mapLayerStacks['0'].length - 1;
        boundingBoxRecords.forEach(boundingBoxRecord =>
            mapBody.reorderLayer(boundingBoxRecord, featureStackLastIndex));

        // push the highlight layer on top of everything else
        if (highlightLayer) {
            mapBody.reorderLayer(highlightLayer, featureStackLastIndex);
        }

        /**
         * A helper function which synchronizes a single sort group of layers between the layer selector and internal layer stack.
         *
         * @function _syncSortGroup
         * @private
         * @param {Number} sortGroup number of a sort group
         */
        function _syncSortGroup(sortGroup) {
            // an ESRI array of layer ids added to the map object
            // low index = low drawing order; legend: low index = high drawing order.
            //
            // for example there are following layers on the map object:
            // ['basemap', 'one', 'two', 'three', 'bbox', 'highlight']
            const mapLayerStack = mapLayerStacks[sortGroup.toString()]

            // a filtered array of layer records that belong to the specified sort group and are in the map layer stack (not errored)
            // this represents a layer order as visible by the user in the layer selector UI component
            //
            // for example the user reorders a layer through UI:
            // ['three', 'one', 'two']
            const layerRecordStack = orderedLayerRecords
                .filter(layerRecord =>
                    Geo.Layer.SORT_GROUPS_[layerRecord.layerType] === sortGroup)
                .filter(layerRecord =>
                    mapLayerStack.indexOf(layerRecord.config.id) !== -1);

            // a sorted in decreasing order map stack index array of layers found in the previous step
            // this just reflects the positions or slots of the layers from the specified sort group on the map
            // for example: [3, 2, 1]
            const layerRecordIndexes = layerRecordStack
                .map(layerRecord =>
                    mapLayerStack.indexOf(layerRecord.config.id))
                .sort((a, b) =>
                    b - a);

            // layers are now iterated using their UI order and moved into the positions or slots found in the previous step
            //
            // the resulting map stack will be:
            // ['basemap', 'three', 'two', 'one', 'bbox', 'highlight']
            //
            // since only the layers belonging to the sort group moved, the basemap, bbox, or highlight layers are not disturbed
            layerRecordStack.forEach((layerRecord, index) => {
                // just in case ESRI does not check for this, do not move layers if its target and current indexes match
                if (layerRecordIndexes[index] !== mapLayerStack.indexOf(layerRecord.config.id)) {
                    mapBody.reorderLayer(layerRecord._layer, layerRecordIndexes[index]);
                }
            });
        }
    }

    /**
     * // TODO: make a wrapper for the bounding box layer
     *
     * Finds and returns a bounding box layer record using the id provided.
     *
     * @function getBoundingBoxRecord
     * @param {Number} id id of the bounding box record to be found
     * @return {Featurelayer} the bounding box record; `undefined` if not found
     */
    function getBoundingBoxRecord(id) {
        const boundingBoxRecords = configService.getSync.map.boundingBoxRecords;

        return boundingBoxRecords.find(boundingBoxRecord =>
            boundingBoxRecord.id === id);
    }

    /**
     * Creates and returns a feature layer to represent a boundign box with the id and extent specified.
     *
     * @function makeBoundingBoxRecord
     * @param {Number} id id of the bounding box record to be assigned to the created bounding box layer record
     * @param {Extent} bbExtent ESRI extent object with the bounding box extent
     * @return {Featurelayer} the bounding box record
     */
    function makeBoundingBoxRecord(id, bbExtent) {
        const boundingBoxRecords = configService.getSync.map.boundingBoxRecords;
        const mapBody = configService.getSync.map.instance;

        let boundingBoxRecord = getBoundingBoxRecord(id);
        if (!boundingBoxRecord) {
            boundingBoxRecord = gapiService.gapi.layer.bbox.makeBoundingBox(
                id, bbExtent, mapBody.extent.spatialReference);

            boundingBoxRecords.push(boundingBoxRecord);
            mapBody.addLayer(boundingBoxRecord);
        }

        return boundingBoxRecord;
    }

    /**
     * Remove bounding box with the id specified.
     *
     * @function removeBoundingBoxRecord
     * @param {Number} id id of the bounding box record to be removed
     */
    function removeBoundingBoxRecord(id) {
        const boundingBoxRecord = getBoundingBoxRecord(id);
        if (!boundingBoxRecord) {
            return;
        }

        const boundingBoxRecords = configService.getSync.map.boundingBoxRecords;
        const index = boundingBoxRecords.indexOf(boundingBoxRecord);

        // Do not need to check if index is valid because getBoundingBoxRecord does not return undefined
        boundingBoxRecords.splice(index, 1);
        const mapBody = configService.getSync.map.instance;
        mapBody.removeLayer(boundingBoxRecord);
    }

    /**
     * Binds onHover event (for feature layers) and displays a hover tooltip if allowed in the layer config.
     *
     * @function _setHoverTips
     * @private
     * @param {LayerRecord} layerRecord a layer record to set the hovertips on
     */
    function _setHoverTips(layerRecord) {
        // TODO: layerRecord returns a promise on layerType to be consistent with dynamic children which don't know their type upfront
        // to not wait on promise, check the layerRecord config
        if (layerRecord.config.layerType !== Geo.Layer.Types.ESRI_FEATURE) {
            return;
        }

        if (!layerRecord.config.state.hovertips) {
            return;
        }

        let tipContent;

        layerRecord.addHoverListener(_onHoverHandler);

        function _onHoverHandler(data) {
            // we use the mouse event target to track which
            // graphic the active tooltip is pointing to.
            // this lets us weed any delayed events that are meant
            // for tooltips that are no longer active.
            const typeMap = {
                mouseOver: e => {
                    events.$broadcast(events.rvFeatureMouseOver, true);

                    // make the content and display the hovertip
                    tipContent = {
                        name: null,
                        svgcode: '<svg></svg>',
                        graphic: e.target
                    };

                    const tipRef = tooltipService.addHoverTooltip(e.point, tipContent);
                },
                tipLoaded: e => {
                    // update the content of the tip with real data.
                    if (tipContent && tipContent.graphic === e.target) {
                        tipContent.name = e.name;
                        tipContent.name = $filter('picture')(e.name);
                        tipContent.svgcode = e.svgcode;
                    }
                    tooltipService.refreshHoverTooltip();
                },
                mouseOut: e => {
                    events.$broadcast(events.rvFeatureMouseOver, false);
                    tooltipService.removeHoverTooltip();
                },
                // TODO: reattach this
                forceClose: () => {
                    // if there is a hovertip, get rid of it
                    //destroyHovertip();
                }
            };

            // execute function for the given type
            typeMap[data.type](data);
        }
    }

    /**
     * Returns an array of ids for rcs added layers
     *
     * @function getRcsLayerIDs
     * @returns {Array}     list of rcs layers' ids
     */
    function getRcsLayerIDs() {

        // FIXME need to handle a layer that has been deleted
        //       but the undo timer has yet to remove it from
        //       the map. In this case, it exists in the map
        //       but not in the legend. Determine best way
        //       to detect this.
        return configService.getSync.map.layers
            .filter(lyr => (lyr.origin === 'rcs'))    // only take rcs layers
            .filter(lyr => (getLayerRecord(lyr.id)))  // only take layers still in the map
            .map(lyr => lyr.id.split('.')[1]);        // extract rcs key from layer id
    }

    return service;
}
