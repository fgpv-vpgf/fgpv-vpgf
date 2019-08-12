import { ConfigLayer, SimpleLayer } from 'api/layers';

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
 * @requires $translate
 * @requires shellService
 * @requires errorService
 * @description
 *
 * The `layerRegistry` factory tracks active layers and constructs legend, provide all layer-related functionality like registering, removing, changing visibility, changing opacity, etc.
 *
 */
angular.module('app.geo').factory('layerRegistry', layerRegistryFactory);

// eslint-disable-next-line max-statements
function layerRegistryFactory(
    $rootScope,
    $filter,
    $translate,
    shellService,
    errorService,
    events,
    gapiService,
    Geo,
    configService,
    tooltipService,
    common,
    ConfigObject
) {
    const service = {
        getLayerRecord,
        getLayerRecordPromise,
        registerLayerRecord,
        loadLayerRecord,
        regenerateLayerRecord,
        removeLayerRecord,

        getBoundingBoxRecord,
        registerBoundingBoxRecord,
        removeBoundingBoxRecord,

        synchronizeLayerOrder,
        syncApiElementOrder,
        getRcsLayerIDs
    };

    const ref = {
        mapLoadingWaitHandle: null,

        // temp storage for layer records in the process of being generated (their corresponding data might be loading - think WFS)
        generatingQueue: {},

        loadingQueue: [],
        loadingCount: 0,

        refreshAttributes: {},

        errorTimeout: {}
    };

    let mApiObjects = null;
    let mapApi = null;

    // lets us know the API is ready
    events.$on(events.rvApiMapAdded, (_, mApi) => {
        mapApi = mApi;

        // add default simpleLayer to the map and initialize any required listeners
        const layerRecord = gapiService.gapi.layer.createGraphicsRecord('');
        const map = configService.getSync.map;
        map.instance.addLayer(layerRecord._layer);

        const simpleLayer = new SimpleLayer(layerRecord, map);
        mapApi.simpleLayerObj = simpleLayer;
        _initializeLayerObservables(simpleLayer);
        _setHover(layerRecord, simpleLayer);

        const tt = mApi.ui.tooltip;

        mApiObjects = {
            mouseOver: tt._mouseOver, // subject
            mouseOut: tt._mouseOut, // subject
            add: tt.add.bind(tt) // tt.add is a function pointer, need to bind tt back into its scope
        };

        // when tooltip is added via the api, we create it here
        tt.added.subscribe(x => {
            x.toolTip = tooltipService.addTooltip(x.screenPosition, {}, x.content);
        });
    });

    // wire in a hook to any map for adding a simple layer using id. this makes it available on the API
    events.$on(events.rvMapLoaded, () => {
        configService.getSync.map.instance.addSimpleLayer = name => {
            const index = mapApi.layers.allLayers.findIndex(layer => layer.id === name);

            let simpleLayer;
            if (index === -1) {
                const layerRecord = gapiService.gapi.layer.createGraphicsRecord(name);
                configService.getSync.map.instance.addLayer(layerRecord._layer);

                simpleLayer = new SimpleLayer(layerRecord, configService.getSync.map);
                _initializeLayerObservables(simpleLayer);
                _addLayerToApiMap(simpleLayer);
                _setHover(layerRecord, simpleLayer);
            }

            return common.$q.resolve(simpleLayer ? [simpleLayer] : []);
        };

        configService.getSync.map.instance.removeSimpleLayer = layerRecord => {
            configService.getSync.map.instance.removeLayer(layerRecord._layer);
            _removeLayerFromApiMap(layerRecord);
        };

        configService.getSync.map.instance.synchronizeLayerOrder = () => {
            synchronizeLayerOrder();
        }
    });

    // listen for filter changes. inspect if they are relevant and apply to target layer if they are
    events.$on(events.rvFilterChanged, (_, params) => {
        // Don't react to extent filters. Layer is auto-filtered by extent just by being on the map.
        if (params.filterType !== 'extent') {
            // see if the layer exists and is active
            const layerRecord = getLayerRecord(params.layerID);
            if (layerRecord && layerRecord.isActiveState) {
                // tell geoApi to have the layer apply its filter to itself on the map
                if (layerRecord.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    layerRecord.applyFilterToLayer(params.layerIdx);
                } else {
                    layerRecord.applyFilterToLayer();
                }
            }
        }
    });

    /**
     * Finds and returns the layer record using the id specified.
     *
     * @function getLayerRecord
     * @param {String} id the id of the layer record to be returned
     * @return {LayerRecord} layer record with the id specified; undefined if not found
     */
    function getLayerRecord(id) {
        const layerRecords = configService.getSync.map.layerRecords;

        return layerRecords.find(layerRecord => layerRecord.layerId === id);
    }

    /**
     * Finds and returns a promise of layer record either already generated or in the process of being generated.
     * If no layer record with such an id found, returns `undefined`.
     *
     * @param {String} id the id of the layer record to be returned
     * @return {Promise<LayerRecord>} promise of layer record with the id specified; undefined if not found
     */
    function getLayerRecordPromise(id) {
        let layerRecordPromise = getLayerRecord(id);

        return layerRecordPromise ? common.$q.resolve(layerRecordPromise) : ref.generatingQueue[id];
    }

    /**
     * Creates the layer record from the provided layerBlueprint, stores it in the shared config and returns the results.
     *
     * @function registerLayerRecord
     * @param {LayerBlueprint} layerBlueprint layerBlueprint used for creating the layer record
     * @return {Promise<LayerRecord>} a promise with the created layerRecord
     */
    function registerLayerRecord(layerBlueprint) {
        // check if the record is already created (generated or being generated)
        let layerRecordPromise = getLayerRecordPromise(layerBlueprint.config.id);

        if (!layerRecordPromise) {
            layerRecordPromise = _startGeneratingLayerRecord(layerBlueprint);
        }

        layerRecordPromise
            .then(layerRecord => (ref.refreshAttributes[layerRecord.layerId] = _attribsInvalidation(layerRecord)))
            .catch(() => { }); // if layer record creation fails, the error will be handled elsewhere

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

                    let configLayer;

                    // remove the pre-existing attributes for the ConfigLayer(s)
                    if (layerRecord.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                        const childIndices = _simpleWalk(layerRecord.getChildTree());
                        childIndices.forEach(idx => {
                            configLayer = mapApi.layers.allLayers.find(
                                layer => layer.id === layerRecord.layerId && layer.layerIndex === idx
                            );
                            if (configLayer) {
                                configLayer.removeAttributes();
                            }
                        });
                    } else {
                        configLayer = mapApi.layers.getLayersById(layerRecord.layerId)[0];
                        if (configLayer) {
                            configLayer.removeAttributes();
                        }
                    }
                }, refreshInterval * 60000);
            }

            return updateAttributes;
        }

        return layerRecordPromise;
    }

    /**
     * Generates a new layer record from the provided layer blueprint and replaces the previously generated layer record (the original position is not kept).
     * This will also remove the corresponding layer from the map, but will not trigger the loading of the new layer.
     * If the layer record was never generated (because it failed for example), start making a new one.
     * If the corresponding layer record is still being generated, does nothing.
     *
     * @function regenerateLayerRecord
     * @param {LayerBlueprint} layerBlueprint the original layerBlueprint of the layer record to be regenerated
     */
    function regenerateLayerRecord(layerBlueprint) {
        const map = configService.getSync.map.instance;
        const layerRecords = configService.getSync.map.layerRecords;

        // if layer record is already in the generating queue, do nothing
        // TODO: add a way to interrupt layer record generation in case it trully needs to be reloaded (like when the generation process is stuck for some reason)
        if (ref.generatingQueue[layerBlueprint.config.id]) {
            return;
        }

        const layerRecord = getLayerRecord(layerBlueprint.config.id);

        // if the record is there, remove from the map
        if (layerRecord) {
            common.$interval.cancel(ref.refreshAttributes[layerRecord.layerId]);
            map.removeLayer(layerRecord._layer);
            const index = layerRecords.indexOf(layerRecord);

            // remove from the layerRecords
            layerRecords.splice(index, 1);
        }

        // generate the layer record again
        // if layer record creation fails, the error will be handled elsewhere;
        _startGeneratingLayerRecord(layerBlueprint, true).catch(() => { });
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

        if (index === -1) {
            return index;
        }

        common.$interval.cancel(ref.refreshAttributes[layerRecord.layerId]);
        layerRecords.splice(index, 1);
        map.removeLayer(layerRecord._layer);

        if (layerRecord.state === Geo.Layer.States.LOADED) {
            layerRecord.removeAttribListener(_onLayerAttribDownload);
            layerRecord.removeFilterListener(_onLayerFilterChange);
        }
        _removeLayerFromApiMap(layerRecord);

        return index;
    }

    /**
     * Finds a layer record (either already generated or being generated) with the specified id and adds it to the map.
     * If the layer is alredy loaded or is in the loading queue, it will not be added the second time.
     * In a case where a layer record is still being generated, waits until this process is complete before adding it to the map.
     *
     * @param {Number} id layer record id to load on the map
     */
    async function loadLayerRecord(id) {
        // check if the record is already created (generated or being generated)
        const layerRecordPromise = getLayerRecordPromise(id);
        const map = configService.getSync.map.instance;

        if (!layerRecordPromise) {
            return;
        }

        // if layer record creation fails, the error will be handled elsewhere
        layerRecordPromise
            .then(layerRecord => {
                const alreadyLoading = ref.loadingQueue.some(lr => lr === layerRecord);
                const alreadyLoaded = map.graphicsLayerIds.concat(map.layerIds).indexOf(layerRecord.config.id) !== -1;

                // do nothing if the corresponding layer record is aleardy loading or has already loaded
                if (alreadyLoading || alreadyLoaded) {
                    return;
                }

                ref.loadingQueue.push(layerRecord);
                _loadNextLayerRecord();
            })
            .catch(error => { });
    }

    /**
     * A helper function to kick of the generation of the layer record.
     * - set the loading flag with the corresponding id
     * - trigger the layerRecord generation using a its blueprint and store the promise
     * - wait for the promise to resolve and store the actual layer record
     * - hook up state event listeners
     *
     * @param {layerBlueprint} layerBlueprint LayerBlueprint object
     * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
     * @returns {Promise<LayerRecord>} a promise resolving with a generated LayerRecord
     */
    function _startGeneratingLayerRecord(layerBlueprint, force = false) {
        const layerRecords = configService.getSync.map.layerRecords;

        // register a loading process for this layer record
        _setLoadingFlagHelper(layerBlueprint.config);

        // start generating a layer record
        let layerRecordPromise = layerBlueprint.makeLayerRecord(force);
        ref.generatingQueue[layerBlueprint.config.id] = layerRecordPromise;

        layerRecordPromise = layerRecordPromise
            .then(layerRecord => {
                // store the actual generated record
                layerRecords.push(layerRecord);

                // start tracking layer record events to update/clear its loading process
                layerRecord.addStateListener(state => _onLayerLifecycleEvents(layerRecord, state));

                return layerRecord;
            })
            // clear the loading flag for this layer record if it fails to resolve
            .catch(error => {
                shellService.clearLoadingFlag(layerBlueprint.config.id);
                return Promise.reject(error);
            })
            // remove from the generatig queue if succeeds or fails
            .finally(() => delete ref.generatingQueue[layerBlueprint.config.id]);

        return layerRecordPromise;
    }

    /**
     * Loads a LayerRecord from the `loadingQueue` by adding it to the map. If the throttle count is reached, waits until some of the currently loading layers finish (or error.)
     *
     * @function _loadNextLayerRecord
     * @private
     */
    // eslint-disable-next-line complexity
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

        // some trickery here.  we can have a situation where calling map.addLayer will trigger _onLayerRecordInitialLoad
        // before the "do initial state check" can happen.  this can result in the loading code inside that handler
        // to be called twice.  but we still need that initial state check for certain layers.
        // so we make a scoped variable that _onLayerRecordInitialLoad can see. we set it to true when the handler loading
        // code runs, and check it prior to the "do initial state check". this catches the really fast cases but
        // also ensures the initial check happens for all other cases. the scoping means the boolean exists for every
        // layer, then dies when everything wraps up.
        let magicScopeReallyFastLoad = false;

        // normal situation
        layerRecord.addStateListener(_onLayerRecordInitialLoad);
        layerRecord.addAttribListener(_onLayerAttribDownload);
        layerRecord.addFilterListener(_onLayerFilterChange);

        mapBody.addLayer(layerRecord._layer);
        ref.loadingCount++;

        // do initial state check
        if (!magicScopeReallyFastLoad) {
            _onLayerRecordInitialLoad(layerRecord.state);
        }

        // when a layer takes too long to load, it could be a slow service or a failed service
        // in any case, the queue will advance after THROTTLE_TIMEOUT
        // failed layers will be marked as failed when the finally resolve
        // slow layers will load on their own at some point
        const throttleTimeoutHandle = common.$timeout(_advanceLoadingQueue, THROTTLE_TIMEOUT);

        /**
         * Waits for the layer to load or fail.
         *
         * @function _onLayerRecordInitialLoad
         * @private
         * @param {String} state name of the new LayerRecord state
         * @private
         */
        function _onLayerRecordInitialLoad(state) {

            if (layerRecord.initLoadDone || state === Geo.Layer.States.ERROR) {
                layerRecord.removeStateListener(_onLayerRecordInitialLoad);
                magicScopeReallyFastLoad = true;
                shellService.clearLoadingFlag(layerRecord.config.id, 300);

                events.$broadcast(events.rvLayerRecordLoaded, layerRecord.layerId);
                common.$timeout.cancel(throttleTimeoutHandle);
                _setHoverTips(layerRecord);
                _advanceLoadingQueue();
            }

            // we need both checks to handle things like server layers that start as invisible.
            // they will never refresh until visible, but want to make the API layer when a load
            // happens. for the weird situations where this gets called twice, the createAPI
            // function wont make duplicates if called more than once.  However we can consider
            // an enhancement in this function to prevent it (or alternately, have two functions
            // reacting to state changes and deregister each when they have hit their condition)
            if (layerRecord.initLoadDone || state === Geo.Layer.States.LOADED) {
                _createApiLayer(layerRecord);
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

            ref.mapLoadingWaitHandle = $rootScope.$watch(
                () => mapConfig.isLoaded,
                value => {
                    if (value) {
                        ref.mapLoadingWaitHandle(); // de-register watch
                        ref.mapLoadingWaitHandle = null;
                        _loadNextLayerRecord();
                    }
                }
            );
        }
    }

    /**
     * Tracks layer record lifecycle events to update corresponding loading processes.
     *
     * @param {object} layerRecord layer record
     * @param {string} state current state of the layer record
     */
    function _onLayerLifecycleEvents(layerRecord, state) {
        switch (state) {
            case Geo.Layer.States.REFRESH:
                _setLoadingFlagHelper(layerRecord.config);
                break;

            case Geo.Layer.States.LOADED:
                // clear up the error timeout delay if any
                common.$timeout.cancel(ref.errorTimeout[layerRecord.config.id]);

                shellService.clearLoadingFlag(layerRecord.config.id, 300);
                break;

            case Geo.Layer.States.ERROR:
                console.log(Geo.Layer.States.ERROR, layerRecord, state);

                // multiple error events are fired by ESRI code when some tiles are missing in a tile layer; this does not mean that the layer is broken, but it does trigger the error toast
                // delay the rendering of the error toast to allow for a subsequent `rv-loaded` event to clear the delay; if `rv-loaded` is not fired before the delay is over, the layer is considered to have failed
                // https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2971
                common.$timeout.cancel(ref.errorTimeout[layerRecord.config.id]);
                ref.errorTimeout[layerRecord.config.id] = common.$timeout(() => {
                    shellService.clearLoadingFlag(layerRecord.config.id);
                    errorService.display({
                        textContent: $translate.instant('toc.layer.longload.failed', {
                            name: `"${layerRecord.config.name}"`
                        })
                        // TODO: add reload action
                        // action: 'reload'
                    }); // .then(response => response === 'ok' ? dostuff() : {});
                }, 250);

                break;
        }
    }

    /**
     * A helper function to set or update a new loading process corresponding to a layer updating.
     *
     * @param {object} config layer record or layer blueprint config
     */
    function _setLoadingFlagHelper(config) {
        shellService.setLoadingFlag({
            id: config.id,
            messageDelay: config.expectedResponseTime,
            message: $translate.instant('toc.layer.longload.message', { name: `"${config.name}"` }),
            action: $translate.instant('toc.layer.longload.hide')
        });
        /* .then(response => {
            if (response === 'ok') {
                // do stuff like reload layer or something
            }
        }) */
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
            .reduce((a, b) => a.concat(a.indexOf(b) < 0 ? b : []), []); // remove duplicates (dynamic group and its children with have the same layer id)

        // if structured legend, take the layer order from the config as the authoritative source
        // TODO:? user-added layers are not added to `configService.getSync.map.layers`; they will be always added at the top of the stack for structured legend, so this is not an immediate concern;
        // if auto legend, take the legend block order from the legend panel
        // TODO: what is adding layer into the `configService.getSync.map.layers` ???
        const orderedLayerRecords = (configService.getSync.map.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE
            ? layerRecordIDsInLegend
            : configService.getSync.map.layers
                .map(layer => layer.id)
                .filter(id => layerRecordIDsInLegend.indexOf(id) !== -1)
        )
            .map(getLayerRecord)
            .filter(lr => lr); // get appropriate layer records

        const orderedLayerRecordsIds = orderedLayerRecords.map(record => record.layerId);
        service.replacementIds = (service.replacementIds === undefined) ? {} : service.replacementIds;

        // this massive loop is to ensure the graphicsLayerIds are properly formatted before being passed into the sortGroup
        mapBody.graphicsLayerIds.forEach(id => {
            if (service.replacementIds[id] === undefined) {
                // if current graphicLayerId does not have a match yet
                if (!orderedLayerRecordsIds.includes(id)
                    && id !== 'graphicsLayer1'
                    && id !== 'graphicsLayer2'
                    && id !== 'rv_hilight') {
                    // find a match for the case where the same ID is not stored in mapBody.graphicLayerIds and orderedLayerRecords
                    const matches = Object.keys(service.replacementIds).map(key => service.replacementIds[key]);
                    orderedLayerRecordsIds.forEach(orderedId => {
                        if (!mapBody.graphicsLayerIds.includes(orderedId) && !mapBody.layerIds.includes(orderedId) && !matches.includes(orderedId)) {
                            service.replacementIds[id] = orderedId;
                        }
                    });
                } else {
                    // mapBody.graphicLayerIds and orderedLayerRecords contain the same ID for the layer
                    service.replacementIds[id] = id;
                }
            }
        });

        // sort group 0 corresponds to all the graphicLayerIDs (or the correct corresponding layers retrieved from orderedLayerRecords as done above)
        const replacementIds = mapBody.graphicsLayerIds.map(id => service.replacementIds[id]);
        const mapLayerStacks = {
            0: replacementIds,
            1: mapBody.layerIds
        };

        const sortGroups = [0, 1];

        sortGroups.forEach(sortGroup => _syncSortGroup(sortGroup));

        // just in case the bbox layers got out of hand,
        // push them to the bottom of the map stack (high drawing order)
        const featureStackLastIndex = mapLayerStacks['0'].length - 1;
        boundingBoxRecords.forEach(boundingBoxRecord => mapBody.reorderLayer(boundingBoxRecord, featureStackLastIndex));

        // push the highlight layer on top of everything else
        if (highlightLayer) {
            mapBody.reorderLayer(highlightLayer, featureStackLastIndex);
        }

        syncApiElementOrder();

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
            const mapLayerStack = mapLayerStacks[sortGroup.toString()];

            // a filtered array of layer records that belong to the specified sort group and are in the map layer stack (not errored)
            // this represents a layer order as visible by the user in the layer selector UI component
            //
            // for example the user reorders a layer through UI:
            // ['three', 'one', 'two']
            const layerRecordStack = orderedLayerRecords
                .filter(layerRecord => Geo.Layer.SORT_GROUPS_[layerRecord.layerType] === sortGroup)
                .filter(layerRecord => mapLayerStack.indexOf(layerRecord.config.id) !== -1);

            // a sorted in decreasing order map stack index array of layers found in the previous step
            // this just reflects the positions or slots of the layers from the specified sort group on the map
            // for example: [3, 2, 1]
            const layerRecordIndexes = layerRecordStack
                .map(layerRecord => mapLayerStack.indexOf(layerRecord.config.id))
                .sort((a, b) => b - a);

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
     * A helper function which synchronizes the order of the api elements
     *
     * @function syncApiElementOrder
     * @private
     */
    function syncApiElementOrder() {
        const legendEntries = configService.getSync.map.legendBlocks.entries.filter(entry => !entry.hidden);
        const legendElements = mapApi.ui.configLegend.children;
        let reorderedElements = [];
        legendEntries.forEach((entry, index) => {
            entry = entry.collapsed ? entry.entries[0] : entry;
            if (legendElements && legendElements.length && entry !== legendElements[index]._legendBlock) {
                const element = legendElements.find(legendElement => entry === legendElement._legendBlock) || reorderedElements.find(legendElement => entry === legendElement._legendBlock);
                if (element) {
                    reorderedElements.push(legendElements[index]);
                    legendElements[index] = element;
                }
            }
        });
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

        return boundingBoxRecords.find(boundingBoxRecord => boundingBoxRecord.id === id);
    }

    /**
     * Creates and returns a feature layer to represent a boundign box with the id and extent specified.
     *
     * @function registerBoundingBoxRecord
     * @param {Number} id id of the bounding box record to be assigned to the created bounding box layer record
     * @param {Extent} bbExtent ESRI extent object with the bounding box extent
     * @return {Featurelayer} the bounding box record
     */
    function registerBoundingBoxRecord(id, bbExtent) {
        const boundingBoxRecords = configService.getSync.map.boundingBoxRecords;
        const mapBody = configService.getSync.map.instance;

        let boundingBoxRecord = getBoundingBoxRecord(id);
        if (!boundingBoxRecord) {
            boundingBoxRecord = gapiService.gapi.layer.bbox.makeBoundingBox(
                id,
                bbExtent,
                mapBody.extent.spatialReference
            );

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
        if (
            layerRecord.config.layerType !== Geo.Layer.Types.ESRI_FEATURE &&
            layerRecord.config.layerType !== Geo.Layer.Types.OGC_WFS
        ) {
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

                    // a "fake" event preventDefault that disables default behavior
                    e.preventDefault = function () {
                        this._prevented = true;
                    };

                    mApiObjects.mouseOver.next({
                        event: e,
                        // attribs is a promise, which resolves on the `mApiTipLoaded` event fired in the tipLoaded event
                        attribs: new Promise(resolve => events.$on('mApiTipLoaded', (_, tip) => resolve(tip.attribs))),
                        // shortcut to add a tooltip with point information already applied
                        add: content => tooltipService.addHoverTooltip(e.point, {}, content)
                    });

                    if (!e._prevented) {
                        // make the content and display the hovertip
                        tipContent = {
                            name: null,
                            svgcode: '<svg></svg>',
                            graphic: e.target
                        };

                        const tipRef = tooltipService.addHoverTooltip(e.point, tipContent);
                    }
                },

                tipLoaded: e => {
                    events.$broadcast('mApiTipLoaded', e);
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

                    e.preventDefault = function () {
                        this._prevented = true;
                    };

                    mApiObjects.mouseOut.next(e);

                    if (!e._prevented) {
                        tooltipService.removeHoverTooltip();
                    }
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
     * Binds onHover event (for graphics layers / api simple layers) and displays a hover tooltip if there are any added to the layer.
     *
     * @function _setHover
     * @private
     * @param {LayerRecord} layerRecord a layer record to set the hovertips on
     * @param {SimpleLayer} simpleLayer an api layer to get the appropriate hovertip content from
     */
    function _setHover(layerRecord, simpleLayer) {
        layerRecord.addHoverListener(_onHoverHandler);

        function _onHoverHandler(data) {
            const mapInstance = configService.getSync.map.instance;

            // we use the mouse event target to track which
            // graphic the active tooltip is pointing to.
            // this lets us weed any delayed events that are meant
            // for tooltips that are no longer active.
            const typeMap = {
                mouseOver: e => {
                    const graphic = data.graphic;
                    const geometry = graphic.geometry;
                    const apiGeo = simpleLayer.geometry.find(geo => geo.id === geometry.apiId);
                    if (!apiGeo || !apiGeo.hover) {
                        return;
                    }

                    const simpleLayerId = simpleLayer.id;
                    const hovertip = apiGeo.hover;
                    const geoId = apiGeo.id;
                    const boundingBox = simpleLayer.getGraphicsBoundingBox([graphic]);
                    const center = boundingBox.getCenter();

                    let point, screenPoint;

                    if (!hovertip.keepOpen && hovertip.followCursor) {
                        screenPoint = e.point;
                    } else {
                        point = center;
                        switch (hovertip.position) {
                            case 'bottom':
                                point.y = boundingBox.ymin;
                                break;
                            case 'left':
                                point.x = boundingBox.xmin;
                                break;
                            case 'right':
                                point.x = boundingBox.xmax;
                                break;
                            default:
                                point.y = boundingBox.ymax;
                        }

                        screenPoint = mapInstance.toScreen(point);
                    }

                    if (hovertip) {
                        const tipRef = tooltipService.addHover(screenPoint, {}, hovertip, geoId, simpleLayerId);
                        if (tipRef) {
                            // hovertip being used for API geometry, so we want to be able to ensure we can click on the contents of the hovertip
                            // this will also ensure that the hovertip (since it can possibly stay open until manually closed) will appear underneath
                            // other content such as panels
                            tipRef.enablePointerEvents();

                            if (hovertip.xOffset || hovertip.yOffset) {
                                tipRef.offset(hovertip.xOffset, hovertip.yOffset);
                            }
                        }
                    }
                },
                mouseOut: e => {
                    tooltipService.removeHover();
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
            .filter(lyr => lyr.origin === 'rcs') // only take rcs layers
            .filter(lyr => getLayerRecord(lyr.id)) // only take layers still in the map
            .map(lyr => lyr.id.split('.')[1]); // extract rcs key from layer id
    }

    return service;

    /**
     * This will check first to see if the API map instance already has this layer defined by its id and index if applicable.
     * Create API ConfigLayer using the layerRecord and config provided if it does not exist.
     * If ConfigLayer already exists (loaded twice, reloaded, etc.), don't create another instance of ConfigLayer.
     * Simply update the relevant fields which will ensure all observables and pointers persist.
     *
     * @function _createApiLayer
     * @private
     * @param {LayerRecord} layerRecord a layer record to use when creating ConfigLayer
     */
    function _createApiLayer(layerRecord) {
        let apiLayer;
        const createdLayers = [];

        // for dynamic layers, it will intentionally create one ConfigLayer for each child while not creating a ConfigLayer for parents
        if (layerRecord.config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
            const childIndices = _simpleWalk(layerRecord.getChildTree());
            childIndices.forEach(idx => {
                let configLayer;
                configLayer = mapApi.layers.allLayers.find(
                    layer => layer.id === layerRecord.layerId && layer.layerIndex === idx
                );

                if (configLayer) {
                    configLayer._initLayerSettings(layerRecord, idx);
                } else {
                    apiLayer = new ConfigLayer(configService.getSync.map, layerRecord, idx);

                    // dynamic layers must have the same identify tolerance for all children, so if one updates we must update them all
                    apiLayer.bufferChanged.subscribe(tolerance => {
                        const children = mapApi.layers.getLayersById(apiLayer.id);
                        children.forEach(child => {
                            const oldBuffer = child._identifyBuffer;
                            if (oldBuffer !== tolerance) {
                                child._identifyBuffer = tolerance;
                                child._bufferChanged.next(tolerance);
                            }
                        });
                    });

                    _initializeLayerObservables(apiLayer);
                    _addLayerToApiMap(apiLayer);
                    createdLayers.push(apiLayer);
                }
            });
        } else {
            // for non-dynamic layers, it will correctly create one ConfigLayer for the layer
            let configLayer;
            configLayer = mapApi.layers.allLayers.find(layer => layer.id === layerRecord.layerId);

            if (configLayer) {
                configLayer._initLayerSettings(layerRecord);
            } else {
                apiLayer = new ConfigLayer(configService.getSync.map, layerRecord);
                _initializeLayerObservables(apiLayer);
                _addLayerToApiMap(apiLayer);
                createdLayers.push(apiLayer);
            }
        }

        events.$broadcast(events.rvApiLayerAdded, createdLayers);
    }

    /**
     * This will subscribe to the apiLayer attribute observables and then notify the LayerGroup of any such changes.
     *
     * @function _initializeLayerObservables
     * @private
     * @param {BaseLayer} apiLayer an instance of an api layer created whose attributes updates we must subscribe to
     */
    function _initializeLayerObservables(apiLayer) {
        apiLayer.attributesAdded.subscribe(attribs => {
            mapApi.layers._attributesAdded.next({
                layer: apiLayer,
                attributes: attribs
            });
        });

        apiLayer.attributesChanged.subscribe(changedAttribs => {
            mapApi.layers._attributesChanged.next({
                layer: apiLayer,
                attributesBeforeChange: changedAttribs.attributesBeforeChange,
                attributesAfterChange: changedAttribs.attributesAfterChange
            });
        });

        apiLayer.attributesRemoved.subscribe(attribs => {
            mapApi.layers._attributesRemoved.next({
                layer: apiLayer,
                attributes: attribs
            });
        });
    }

    /**
     * Push a new layer to the list of layers for the map
     *
     * @function _addLayerToApiMap
     * @private
     * @param {BaseLayer} apiLayer an instance of an api layer created that needs to be added to map
     */
    function _addLayerToApiMap(apiLayer) {
        mapApi.layers.allLayers.push(apiLayer);
        mapApi.layers._layerAdded.next(apiLayer);
    }

    function _simpleWalk(treeChildren) {
        // roll in the results into a flat array
        return [].concat.apply(
            [],
            treeChildren.map((treeChild, index) => {
                if (treeChild.childs) {
                    return [].concat(_simpleWalk(treeChild.childs));
                } else {
                    return treeChild.entryIndex;
                }
            })
        );
    }

    /**
     * Listens for attributes downloaded for a layer
     *
     * @function _onLayerAttribDownload
     * @private
     * @param {LayerRecord} layerRecord a layerRecod whose id is used to trigger observable
     * @param {String} idx index of the layer whose attribtues were downloaded
     * @param {Object} attribs the attributes that were downloaded
     */
    function _onLayerAttribDownload(layerRecord, idx, attribs) {
        let configLayer;
        if (layerRecord.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
            configLayer = mapApi.layers.allLayers.find(
                l => l.id === layerRecord.layerId && l.layerIndex === parseInt(idx)
            );
        } else {
            configLayer = mapApi.layers.getLayersById(layerRecord.layerId)[0];
        }

        if (configLayer) {
            configLayer.fetchAttributes();
        }
    }

    /**
     * Listens for filter changes on a layer, converts it to an angular event
     *
     * @function _onLayerFilterChange
     * @private
     * @param {Object} params event parameters from geoApi event
     */
    function _onLayerFilterChange(params) {
       events.$broadcast(events.rvFilterChanged, params);
    }

    /**
     * This will remove the layer from the API map instance
     *
     * @function _removeLayerFromApiMap
     * @private
     * @param {LayerRecord} layerRecord a layerRecord to be used to remove the corresponding api layer from map
     */
    function _removeLayerFromApiMap(layerRecord) {
        let index;

        // removing dynamic layers does not actually remove the layer if another child is still present  ?
        if (layerRecord.layerType === Geo.Layer.Types.ESRI_DYNAMIC && layerRecord.state === Geo.Layer.States.LOADED) {
            const childIndices = _simpleWalk(layerRecord.getChildTree());
            childIndices.forEach(idx => {
                index = mapApi.layers.allLayers.findIndex(
                    layer => layer.id === layerRecord.layerId && layer.layerIndex === idx
                );
                if (index !== -1) {
                    const apiLayer = mapApi.layers.allLayers[index];

                    mapApi.layers.allLayers.splice(index, 1);
                    mapApi.layers._layerRemoved.next(apiLayer);
                }
            });
        } else {
            index = mapApi.layers.allLayers.findIndex(layer => layer.id === layerRecord.layerId);
            if (index !== -1) {
                const apiLayer = mapApi.layers.allLayers[index];

                mapApi.layers.allLayers.splice(index, 1);
                mapApi.layers._layerRemoved.next(apiLayer);
            }
        }
    }
}
