import { Observable, Subject, BehaviorSubject } from 'rxjs';

/**
 *
 * @module LegendBlock
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * `LegendBlock` exposed five legend block classes and the ProxyWrapper class.
 *
 */
angular.module('app.geo').factory('LegendBlock', LegendBlockFactory);

function LegendBlockFactory(
    $rootScope,
    common,
    Geo,
    layerRegistry,
    gapiService,
    configService,
    SymbologyStack,
    appInfo
) {
    let legendBlockCounter = 0;

    const ref = {
        walkFunction,
        aggregateStates,

        isControlVisible,
        isControlDisabled,
        isControlSystemDisabled,
        isControlUserDisabled,

        get map() {
            return configService.getSync.map;
        }
    };

    const TYPES = {
        INFO: 'info',
        NODE: 'node',
        GROUP: 'group',
        SET: 'set'
    };

    /**
     * Links a proxy layer object with the corresponding layer. This is required since layer config might have
     * client-only settings specified that are not available through the proxy. Also, initial opacity, visibility, and query
     * states are set on the proxy objects here using the values from the layer config.
     *
     * @class ProxyWrapper
     */
    class ProxyWrapper {
        _proxy = null;
        _proxyPromise = null;

        /**
         * Creates a new `ProxyWrapper` from a layer proxy object and layer config.
         *
         * @param {Promise<LayerProxy>} proxyPromise a promise of a layer proxy object which will be coupled with a corresponding layer config object
         * @param {LayerNode} layerConfig layer config defintion object from the config file; it may provide overrides and initial settings for the layer proxy object
         */
        constructor(proxyPromise, layerConfig) {
            this._initProxyPromise(proxyPromise);
            this._layerConfig = layerConfig;

            this.isControlVisible = ref.isControlVisible.bind(this);
            this.isControlDisabled = ref.isControlDisabled.bind(this);
            this.isControlSystemDisabled = ref.isControlSystemDisabled.bind(this);
            this.isControlUserDisabled = ref.isControlUserDisabled.bind(this);
        }

        _initProxyPromise(proxyPromise) {
            this._proxyPromise = proxyPromise;

            // wait for the proxy to be resolved;
            // for WFS layers proxy resolves when the layer record is made and "loaded"
            // for other layer types proxy resolves when the layer record is made (layer is not necessarily loaded at this point)
            this._proxyPromise
                .then(proxy => {
                    this._proxy = proxy;

                    // This will apply initial state values from the layer config object to the layer proxy object.
                    // This is needed to apply state settings that are not set in geoApi (dynamic layers, for example, start up as fully invisible to prevent flicker on initial load).
                    this.opacity = this._layerConfig.state.opacity;
                    this.visibility = this._layerConfig.state.visibility;
                    this.query = this._layerConfig.state.query;

                    this._updateApiLayerVisibility(this);
                    this._updateApiLayerOpacity(this);
                    this._updateApiLayerQueryable(this);
                })
                .catch(error => {
                    console.error(`Layer proxy failed to resolve for "${this.layerConfig.id}"`, error);
                    // if the proxy fails to resolve (layer data failed to load, etc.), set status to `rv-error`
                    this._lastState = Geo.Layer.States.ERROR;
                });
        }

        /**
         * Checks if a proxy object is resolved or not, and throws error if not and no callback is provided.
         *
         * @param {*} [callback=null] a function to run later when the proxy is resolved
         * @returns {Boolean} returns `true` if the proxy is resolved; `false` otherwise and a callback is provided;
         * @memberof ProxyWrapper
         */
        _proxyCheck(callback = null) {
            if (this._proxy) {
                return true;
            } else if (callback) {
                this.proxyPromise.then(callback);
                return false;
            } else {
                throw new Error('Layer proxy is not yet resolved.');
            }
        }

        get proxyPromise() {
            return this._proxyPromise;
        }

        /**
         * @return {Proxy} original gapi proxy object
         */
        get proxy() {
            this._proxyCheck();

            return this._proxy;
        }

        /**
         * @return {LayerNode} original typed layer config object
         */
        get layerConfig() {
            return this._layerConfig;
        }

        _stateTimeout = null;
        _lastState = Geo.Layer.States.LOADING; // last valid state

        /**
         * A helper function to update state and cancel the state timeout.
         *
         * @memberof ProxyWrapper
         */
        _updateState() {
            common.$timeout.cancel(this._stateTimeout);
            this._stateTimeout = null;

            this._lastState = this._proxy.state;
        }

        get state() {
            // if no proxy object is available, this is a config-added file-like layer with remote-data (aka WFS or a file-layer)
            if (!this._proxy) {
                return this._lastState;
            }

            if (this._proxy.state === this._lastState) {
                return this._lastState;
            }

            // multiple error events are fired by ESRI code when some tiles are missing in a tile layer; this does not mean that the layer is broken, but it does trigger the error toast
            // delay the state update to allow for a subsequent `rv-loaded` event to clear the delay; if `rv-loaded` is not fired before the delay is over, the layer is considered to have failed
            // https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2971
            if (this._proxy.state !== Geo.Layer.States.ERROR) {
                this._updateState();
            } else if (this._lastState !== Geo.Layer.States.ERROR && !this._stateTimeout) {
                this._stateTimeout = common.$timeout(() => this._updateState.apply(this), 2500);
            }

            return this._lastState;
        }

        get isActiveState() {
            return this._proxy ? this._proxy.activeState : false;
        }

        get name() {
            return this._proxy ? this._proxy.name : this._layerConfig.name;
        }
        get opacity() {
            return this._proxy ? this._proxy.opacity : this._layerConfig.state.opacity;
        }
        get visibility() {
            return this._proxy ? this._proxy.visibility : this._layerConfig.state.visibility;
        }
        get layerType() {
            return this._proxy ? this._proxy.layerType : this._layerConfig.layerType;
        }

        get parentLayerType() {
            this._proxyCheck();
            return this._proxy.parentLayerType;
        }
        get featureCount() {
            this._proxyCheck();
            return this._proxy.featureCount;
        }
        get loadedFeatureCount() {
            this._proxyCheck();
            return this._proxy.loadedFeatureCount;
        }
        get geometryType() {
            this._proxyCheck();
            return this._proxy.geometryType;
        }
        get extent() {
            this._proxyCheck();
            return this._proxy.extent;
        }
        get symbology() {
            this._proxyCheck();
            return this._proxy.symbology;
        }
        get formattedAttributes() {
            this._proxyCheck();
            return this._proxy.formattedAttributes;
        }
        get itemIndex() {
            this._proxyCheck();
            return this._proxy.itemIndex;
        }
        get queryUrl() {
            this._proxyCheck();
            return this._proxy.queryUrl;
        }
        // TODO pick better name.  using filterState due to current collision with other config-based .filter getter
        get filterState() {
            this._proxyCheck();
            return this._proxy.filter;
        }

        get query() {
            return this._proxy ? this._proxy.query : this._layerConfig.state.query;
        }

        get snapshot() {
            return this._layerConfig.state.snapshot;
        }
        get boundingBox() {
            return this._layerConfig.state.boundingBox;
        }

        set opacity(value) {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(() => (this.opacity = value))) {
                return;
            }

            if (this.isControlSystemDisabled('opacity')) {
                return;
            }

            this._proxy.setOpacity(value);

            // store opacity value in the layer config; will be used by full state restore
            this._layerConfig.state.opacity = value;

            this._updateApiLayerOpacity(this);
        }
        set visibility(value) {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(() => (this.visibility = value))) {
                return;
            }

            if (this.isControlSystemDisabled('visibility')) {
                return;
            }

            this._proxy.setVisibility(value);

            // store visibility value in the layer config; will be used by full state restore
            this._layerConfig.state.visibility = value;

            this._updateApiLayerVisibility(this);
        }
        set query(value) {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(() => (this.query = value))) {
                return;
            }

            if (this.isControlSystemDisabled('query')) {
                return;
            }

            // bounding box belongs to the LegendBlock, not ProxyWrapper;
            // so, setting boundingBox value doesn't call the proxy object,
            // it just stores the value in the layer config state for future bookmark use
            this._proxy.setQuery(value);

            // store query value in the layer config; will be used by full state restore
            this._layerConfig.state.query = value;

            this._updateApiLayerQueryable(this);
        }

        set boundingBox(value) {
            if (this.isControlSystemDisabled('boundingBox')) {
                return;
            }

            this._layerConfig.state.boundingBox = value;
        }


        /**
         * Layer config object persists through layer reload (corresponding layer record and legend blocks are destroyed),
         * the changed snapshot value will be processed in geoApi on the subsequent generation of layer records.
         *
         * @param {Boolean} value stores the snapshot value on the layer config object
         */
        set snapshot(value) {
            this._layerConfig.state.snapshot = value;
        }

        /**
         * Checks if the layer is off scale by calling its proxy object with the current map scale value.
         *
         * @return {Object} of the form {offScale: <Boolean>, zoomIn: <Boolean> }
         */
        isOffScale() {
            this._proxyCheck();
            return this._proxy.isOffScale(ref.map.instance.getScale());
        }

        zoomToBoundary() {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(this.zoomToBoundary)) {
                return;
            }

            return this._proxy.zoomToBoundary(ref.map.instance);
        }

        zoomToScale() {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(this.zoomToScale)) {
                return;
            }

            return this._proxy.zoomToScale(ref.map.instance, ref.map.selectedBasemap.lods, this.isOffScale().zoomIn);
        }

        /**
         * Zooms to a graphic with the specified oid.
         *
         * @param {Number} oid object oid
         * @param {Object} offsetFraction fractions of the current extent occupied by main and data panels in the form of { x: <Number>, y: <Number> }
         * @return {Promise} a promise resolving when the extent change is comlete
         */
        zoomToGraphic(oid, offsetFraction) {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(() => this.zoomToGraphic(oid, offsetFraction))) {
                return;
            }

            return this._proxy.zoomToGraphic(oid, ref.map.instance, offsetFraction);
        }

        /**
         * Retrieves a graphic with the id specified.
         *
         * @param {Number} oid the object id to be returned
         * @param {Object} opts options object for the graphic
         * @return {Promise} a promise resolving with a graphic object
         */
        fetchGraphic(oid, opts) {
            // the proxy has not resolved yet; retry when resolved;
            if (!this._proxyCheck(() => this.fetchGraphic(oid, opts))) {
                return;
            }

            return this._proxy.fetchGraphic(oid, opts);
        }

        abortAttribLoad() {
            // the proxy has not resolved yet
            this._proxyCheck();

            this._proxy.abortAttribLoad();
        }

        /**
         * Returns the value of the `userAdded` state flag.
         *
         * @return {Boolean} `true` is the layer was added by a user
         */
        get userAdded() {
            return this._layerConfig.state.userAdded;
        }

        // find whos calling this. determine if still relevant. attempt to port to new filter regime
        // might want to use this.filterState.isActive() which returns boolean.
        // See https://github.com/fgpv-vpgf/fgpv-vpgf/issues/3263#issuecomment-460794432 for further analysis on this
        /**
         * Returns the value of the `filter` state flag.
         *
         * @return {Boolean} `true` is the layer has filter
         */
        get filter() {
            return this._layerConfig.filter;
        }

        set filter(value) {
            this._layerConfig.filter = value;
        }

        // if the projection is not valid, the layer cannot be displayed on the map
        _validProjection = true;
        get validProjection() {
            return this._validProjection;
        }

        /**
         * Checks if the spatial reference of the layer matches the spatial reference of the current basemap.
         * If it doesn't, the layer cannot be displayed on the map.
         *
         * @function validateProjection
         */
        validateProjection() {
            // validate projection only for tile layers; although Aly said that wms, dynamic and image layers are potentially affected as well;
            if (this.proxy.parentLayerType !== Geo.Layer.Types.ESRI_TILE) {
                return;
            }

            this._validProjection = this.proxy.validateProjection(ref.map.selectedBasemap.spatialReference) !== false;
        }

        get metadataUrl() {
            return this._layerConfig.metadataUrl;
        }
        set metadataUrl(url) {
            this._layerConfig.metadataUrl = url;
        }

        get catalogueUrl() {
            return this._layerConfig.catalogueUrl;
        }

        get availableControls() {
            return this._layerConfig.controls;
        }
        get disabledControls() {
            return this._layerConfig.disabledControls;
        }
        get userDisabledControls() {
            return this._layerConfig.userDisabledControls;
        }

        /**
         * @function _updateApiLayerOpacity
         * @private
         * @param {LegendBlock} legendBlock legend block where opacity is being updated
         */
        _updateApiLayerOpacity() {
            let layer;

            if (appInfo.mapi) {
                if (this._layerConfig.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    // TODO: find a better way to find the dynamic ConfigLayer than directly comparing geoApi proxies
                    // potentially can add a 'layerId' to the proxy which will allow for an easy comparison
                    // of both the id and index to find the correct layer
                    layer = appInfo.mapi.layers.allLayers.find(l => l._layerProxy === this.proxy);
                } else {
                    layer = appInfo.mapi.layers.getLayersById(this._layerConfig.id)[0];
                }

                if (layer && layer.opacity !== this._proxy.opacity) {
                    layer._opacityChanged.next(this._proxy.opacity);
                }
            }
        }

        /**
         * @function _updateApiLayerVisibility
         * @private
         * @param {LegendBlock} legendBlock legend block where visibility is being updated
         */
        _updateApiLayerVisibility() {
            let layer;

            if (appInfo.mapi) {
                if (this._layerConfig.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    // TODO: find a better way to find the dynamic ConfigLayer than directly comparing geoApi proxies
                    // potentially can add a 'layerId' to the proxy which will allow for an easy comparison
                    // of both the id and index to find the correct layer
                    layer = appInfo.mapi.layers.allLayers.find(l => l._layerProxy === this.proxy);
                } else {
                    layer = appInfo.mapi.layers.getLayersById(this._layerConfig.id)[0];
                }

                // push update into the observable
                if (layer && layer.visibility !== this._proxy.visibility) {
                    layer._visibilityChanged.next(this._proxy.visibility);
                }
            }
        }

        /**
         * @function _updateApiLayerQueryable
         * @private
         * @param {LegendBlock} legendBlock legend block where query value is being updated
         */
        _updateApiLayerQueryable() {
            let layer;

            if (appInfo.mapi) {
                if (this._layerConfig.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    // TODO: find a better way to find the dynamic ConfigLayer than directly comparing geoApi proxies
                    // potentially can add a 'layerId' to the proxy which will allow for an easy comparison
                    // of both the id and index to find the correct layer
                    layer = appInfo.mapi.layers.allLayers.find(l => l._layerProxy === this.proxy);
                } else {
                    layer = appInfo.mapi.layers.getLayersById(this._layerConfig.id)[0];
                }

                if (layer && layer.queryable !== this._proxy.query) {
                    layer._queryableChanged.next(this._proxy.query);
                }
            }
        }
    }

    class LegendBlock {
        constructor(blockConfig) {
            this._blockConfig = blockConfig;
            this._hidden = this.blockConfig.hidden === true;
        }

        _controlled = false;
        _hidden = false;

        get isInteractive() {
            return false;
        }

        get id() {
            if (!this._id) {
                this._id = `${this.blockType}_${++legendBlockCounter}`;
            }

            return this._id;
        }

        get blockConfig() {
            return this._blockConfig;
        }
        get template() {
            return this.blockType;
        }

        /**
         * @param {Boolean} value specifies if the LegendBlock is directly controlled by a parent LegendBlock and has no visible UI
         */
        set controlled(value) {
            this._controlled = value;
        }

        /**
         * @returns {Boolean} returns true if the LegendBlock is directly controlled by a parent LegendBlock and has no visible UI
         */
        get controlled() {
            return this._controlled;
        }

        get hidden() {
            return this._hidden;
        }
        set hidden(value) {
            this._hidden = value;
        }

        _parent = null;
        set parent(value) {
            this._parent = value;
        }
        /**
         * @return {LegendEntry} a true parent of the legend block, can be a LegendGroup or a LegendSet
         */
        get parent() {
            return this._parent;
        }

        /**
         * @return {LegendEntry} a visual parent of the legend block, can be a LegendGroup or a LegendSet; in case of a collapsed group, a visual parent of its entries is the parent of the collapsed group
         */
        get visualParent() {
            if (this.parent.blockType === LegendBlock.GROUP && this.parent.collapsed) {
                return this.parent.parent;
            }

            return this.parent;
        }

        static INFO = 'info';
        static NODE = 'node';
        static GROUP = 'group';
        static SET = 'set';
    }

    class LegendInfo extends LegendBlock {
        constructor(blockConfig) {
            super(blockConfig);

            this._symbologyStack = new SymbologyStack(
                null,
                blockConfig.symbologyStack,
                blockConfig.coverIcon,
                this.symbologyRenderStyle,
                this.symbologyExpanded,
                true
            );

            this._canEnlarge = false;
        }

        get blockType() {
            return TYPES.INFO;
        }

        get infoType() {
            return this.blockConfig.infoType;
        }
        get content() {
            return this.blockConfig.content;
        }

        get description() {
            return this.blockConfig.description;
        }
        get symbologyStack() {
            return this._symbologyStack;
        }
        get symbologyRenderStyle() {
            return this.blockConfig.symbologyRenderStyle;
        }
        get symbologyExpanded() {
            return this.blockConfig.symbologyExpanded;
        }

        get canEnlarge() {
            return this._canEnlarge;
        }
        set canEnlarge(value) {
            this._canEnlarge = value;
        }

        get isVisibleOnExport() {
            return configService.getSync.services.export.legend.showInfoSymbology && this.blockConfig.export;
        }
    }

    // can be node or group
    class LegendEntry extends LegendBlock {
        constructor(blockConfig) {
            super(blockConfig);

            this.isControlVisible = ref.isControlVisible.bind(this);
            this.isControlDisabled = ref.isControlDisabled.bind(this);
            this.isControlSystemDisabled = ref.isControlSystemDisabled.bind(this);
            this.isControlUserDisabled = ref.isControlUserDisabled.bind(this);
            this._selectedChanged = new Subject();
        }

        get isInteractive() {
            return true;
        }

        _isSelected = false;

        _layerRecordId = null;

        get isSelected() {
            return this._isSelected;
        }
        set isSelected(value) {
            this._isSelected = value;
            this._selectedChanged.next(value);
        }

        get selectedChanged() {
            return this._selectedChanged.asObservable();
        }

        /**
         * Sets layer record id on legend entry.
         *
         * @param {String} value id of the layer bound to this legend block; this will be used in reordering and reloading
         */
        set layerRecordId(value) {
            this._layerRecordId = value;
        }
        /**
         * @param {String} value id of the layer bound to this legend block; this will be used in reordering and reloading
         */
        get layerRecordId() {
            // layerRecordId is null until set in by the legend service;
            return this._layerRecordId;
        }

        /**
         * @return {Boolean} true if the LegendEntry's visual parent is a set; an child entry of a collapsed group which is a part of a set, is be considered a part of that set;
         */
        get inSet() {
            if (!this.parent) {
                return false;
            }

            return this.visualParent.blockType === LegendBlock.SET;
        }
    }

    class LegendNode extends LegendEntry {
        constructor(proxyWrapper, blockConfig) {
            super(blockConfig);

            this._proxyWrapper = proxyWrapper;
            this._controlledProxyWrappers = [];

            this._aggregateStates = ref.aggregateStates;
            this._visibilityChanged = new Subject();
            this._symbolVisibilityChanged = new Subject();

            this._symbologyStack = new SymbologyStack(
                this.proxyWrapper.proxyPromise,
                blockConfig.symbologyStack,
                blockConfig.coverIcon,
                blockConfig.symbologyRenderStyle,
                blockConfig.symbologyExpanded,
                true
            );

            // wait for the layer to load before trying to make a bounding box or validate the projection
            const deregisterWatch = $rootScope.$watch(
                () => this.proxyWrapper.state,
                state => {
                    if (state === Geo.Layer.States.LOADED) {
                        // this is the first chance to properly create bounding box for this legend node
                        // since it's created on demand and cannot be created by geoapi when creating layerRecord
                        // need to read the layer config state here and initialize the bounding box manually when the layer loads
                        // Not all state is applied to the layer record inside geoApi;
                        // as a result, legend service reapplies all the state to all legend blocks after layer record is loaded
                        this.boundingBox = this.proxyWrapper.boundingBox;
                        this.proxyWrapper.validateProjection();
                    } else if (state !== Geo.Layer.States.ERROR) {
                        return;
                    }

                    // this will be called on `rv-error` and on `rv-loaded`
                    deregisterWatch();
                }
            );

            // TODO grid plugin should have better way of hiding rows if grid is invisible. should not be tied to symbology
            // applies visibility settings to grid
            if (!this.visibility) {
                this.symbDefinitionQuery = '1=2';
            }
        }

        get proxyWrapper() {
            return this._proxyWrapper;
        }

        addControlledProxyWrapper(proxyWrapper) {
            this._controlledProxyWrappers.push(proxyWrapper);
        }

        /**
         * Synchronizes opacity and visiblity values of the controlled proxies to the main proxy connected to this legend block.
         *
         * @function synchronizeControlledProxyWrappers
         */
        synchronizeControlledProxyWrappers() {
            this._controlledProxyWrappers.forEach(proxyWrapper => {
                proxyWrapper.visibility = this.visibility;
                proxyWrapper.opacity = this.opacity;
            });
        }

        set reloadConfig(value) {
            this._reloadConfig = value;
        }
        get reloadConfig() {
            return this._reloadConfig;
        }

        get blockType() {
            return TYPES.NODE;
        }

        get _allProxyWrappers() {
            return [this.proxyWrapper].concat(this._controlledProxyWrappers);
        }

        get availableControls() {
            return this.proxyWrapper.availableControls;
        }
        get disabledControls() {
            return this.proxyWrapper.disabledControls;
        }
        get userDisabledControls() {
            return this.proxyWrapper.userDisabledControls;
        }

        get state() {
            if (!this.proxyWrapper.validProjection) {
                return Geo.Layer.States.BAD_PROJECTION;
            }

            const allStates = this._allProxyWrappers.map(proxyWrapper => proxyWrapper.state);
            const combinedState = this._aggregateStates(allStates);

            return combinedState;
        }

        get template() {
            const stateToTemplate = {
                // TODO would be nice if we could leverage Geo.Layer.States constants instead of hardcoding
                'rv-loading': () => 'placeholder',
                'rv-loaded': () => super.template,
                'rv-refresh': () => super.template,
                'rv-error': () => 'error',
                'rv-bad-projection': () => 'bad-projection'
            };

            return stateToTemplate[this.state]();
        }

        get isRefreshing() {
            const state = this.state;

            return state === Geo.Layer.States.LOADING || state === Geo.Layer.States.REFRESH;
        }

        get sortGroup() {
            return Geo.Layer.SORT_GROUPS_[this.proxyWrapper.layerType];
        }

        get name() {
            return this._proxyWrapper.name;
        }
        get layerType() {
            return this._proxyWrapper.layerType;
        }
        get parentLayerType() {
            return this._proxyWrapper.parentLayerType;
        }
        get featureCount() {
            return this._proxyWrapper.featureCount;
        }

        _derivedLoadedFeatureCount = 0;
        _stopFeatureCountInterval = null;

        get loadedFeatureCount() {
            if (this._proxyWrapper.featureCount === this._proxyWrapper.loadedFeatureCount) {
                common.$interval.cancel(this._stopFeatureCountInterval);
                this._stopFeatureCountInterval = null;
                this._derivedLoadedFeatureCount = 0;
                return this._proxyWrapper.loadedFeatureCount;
            }

            return this._derivedLoadedFeatureCount;
        }

        get geometryType() {
            return this._proxyWrapper.geometryType;
        }

        // on change, update the corresponding css rule to make bboxes click-through
        get bboxId() {
            return `${this.id}_bbox`;
        }

        get itemIndex() {
            return this.proxyWrapper.itemIndex;
        }

        get visibility() {
            return this.proxyWrapper.visibility;
        }
        set visibility(value) {

            if (this.isControlSystemDisabled('visibility')) {
                return;
            }

            this._allProxyWrappers.forEach(proxyWrapper => (proxyWrapper.visibility = value));

            updateLegendElementVisibility(this);

            // hide bounding box when the layer goes invisible
            if (!value) {
                this.boundingBox = false;
            }

            this._visibilityChanged.next(value);
        }

        get fullyVisible() {
            return this.symbologyStack.allSymbolsVisible === undefined ? null : this.symbologyStack.allSymbolsVisible();
        }

        get fullyInvisible() {
            return this.symbologyStack.noSymbolsVisible === undefined ? null : this.symbologyStack.noSymbolsVisible();
        }

        get visibilityChanged() {
            return this._visibilityChanged.asObservable();
        }

        get symbolVisibilityChanged() {
            return this._symbolVisibilityChanged.asObservable();
        }

        get opacity() {
            return this.proxyWrapper.opacity;
        }
        set opacity(value) {
            if (this.isControlSystemDisabled('opacity')) {
                return;
            }

            this._allProxyWrappers.forEach(proxyWrapper => (proxyWrapper.opacity = value));

            updateLegendElementOpacity(this);
        }

        // since query is applied only on the main proxy wrapper, we don't need to do an extra check if this control is available; it will be checked in the proxy wrapper
        get query() {
            return this.proxyWrapper.query;
        }
        set query(value) {
            this.proxyWrapper.query = value;

            updateLegendElementQueryable(this);
        }

        get snapshot() {
            return this.proxyWrapper.snapshot;
        }
        /**
         * Setting snapshot to `true` is permanent - if a snapshoted layer is reloaded manually in the future, it reloads as a snapshoted layer.
         * @param {Boolean} value specified layer's snapshot value
         */
        set snapshot(value) {
            this.proxyWrapper.snapshot = value;
        }

        /**
         * Creates and stores (if missing) a bounding box based on the full extent exposed by the proxy object.
         *
         * @function _makeBbox
         * @private
         */
        _makeBbox() {
            if (this._bboxProxy) {
                return;
            }

            const currentWkid = ref.map.selectedBasemap.spatialReference.wkid;
            this._bboxProxy = layerRegistry.getBoundingBoxRecord(this.bboxId);

            if (!this._bboxProxy) {
                // no cached bounding box found
                this._bboxProxy = layerRegistry.registerBoundingBoxRecord(this.bboxId, this.proxyWrapper.extent);
            } else if (this._bboxProxy.spatialReference.wkid !== currentWkid) {
                // cached bbox projection not compatible
                this._bboxProxy = layerRegistry.removeBoundingBoxRecord(this.bboxId);
                this._bboxProxy = layerRegistry.registerBoundingBoxRecord(this.bboxId, this.proxyWrapper.extent);
            }
        }

        get boundingBox() {
            if (!this.proxyWrapper.extent) {
                return false;
            }

            const bbox = layerRegistry.getBoundingBoxRecord(this.bboxId);

            if (!this._bboxProxy && bbox) {
                this._bboxProxy = bbox;
            }

            return this._bboxProxy ? this._bboxProxy.visible : false;
        }

        set boundingBox(value) {
            const currentWkid = ref.map.selectedBasemap.spatialReference.wkid;

            if (!value && !this._bboxProxy) {
                return;
            } else if (!this._bboxProxy || this._bboxProxy.spatialReference.wkid !== currentWkid) {
                this._makeBbox();
            }

            this._bboxProxy.setVisibility(value);
            this.proxyWrapper.boundingBox = value;
        }

        get userAdded() {
            return this.proxyWrapper.userAdded;
        }

        // TODO find whos calling this. determine if still relevant. attempt to port to new filter regime
        get filter() {
            return this.proxyWrapper.filter;
        }

        set filter(value) {
            this.proxyWrapper.filter = value;
        }

        get queryUrl() {
            return this.proxyWrapper.queryUrl;
        }

        setLoadingPanel(loadingPanel) {
            this.loadingPanel = loadingPanel;
        }

        get formattedData() {
            if (this._stopFeatureCountInterval === null) {
                this._stopFeatureCountInterval = this._predictLoadedFeatureCount(this);
            }

            return this._proxyWrapper.formattedAttributes;
        }

        /**
         * @function predictLoadedFeatureCount
         * @private
         * @param {LegendBlock} legendBlock legend block where features are being loaded
         * @return {Function} a function to stop predictions
         */
        _predictLoadedFeatureCount() {
            const updateDelta = 100; // how often estimates are updated
            let chunkSize = Math.min(1000, this._proxyWrapper.featureCount); // initial guess at the number of records loaded at a time
            let chunkLoadTime = 3000; // initial guess at how long it takes to load a chunk of records
            let timeSinceChunkLoad = 0; // time passed since the last chunk was loaded
            let previousCount = this._proxyWrapper.loadedFeatureCount;
            let updateCount = 0; // estimate on how many updates can be made before the next chunk is loaded
            let maximumUpdateValue = 0; // estimate on the maximum update value
            let updateValue = 0; // randomized update value

            this._derivedLoadedFeatureCount = 0;
            if (this.loadingPanel !== undefined) {
                this.loadingPanel.open();
            }

            const stopInterval = common.$interval(() => {
                updateCount = chunkLoadTime / updateDelta;
                maximumUpdateValue = (chunkSize / updateCount) * 2;
                updateValue = Math.random() * maximumUpdateValue;
                this._derivedLoadedFeatureCount += updateValue;
                if (this.loadingPanel !== undefined) {
                    this.loadingPanel.prepareBody();
                }

                timeSinceChunkLoad += updateDelta;

                // if the estimate overshoots the total feature count, set it to the total feature count
                // if the estimate is somehow less than 0, set it to 0
                // this is to prevent the value display to be in the negatives or higher than the total amount required to load
                if (this._derivedLoadedFeatureCount > this._proxyWrapper.featureCount) {
                    this._derivedLoadedFeatureCount = this._proxyWrapper.featureCount;
                } else if (this._derivedLoadedFeatureCount < 0) {
                    this._derivedLoadedFeatureCount = 0;
                }
                if (this.loadingPanel !== undefined) {
                    this.loadingPanel.prepareBody();
                }

                // when the actual loaded feature count changes...
                if (previousCount !== this._proxyWrapper.loadedFeatureCount) {
                    // udpate time estimate on how long it takes to load a chunk
                    chunkLoadTime = timeSinceChunkLoad;
                    timeSinceChunkLoad = 0;

                    // update the chunk size estimate to actual chunk size loaded by geoApi
                    chunkSize = this._proxyWrapper.loadedFeatureCount - previousCount;

                    // if the estimate overshoots the actual loaded count; decrease the chunksize accordingly
                    // say, previousCount = 0; loadedFeatureCount = 1000; derivedLoadedFeatureCount = 1100;
                    // then chunkSize will be set to 900, targeting 2000 for the next set of estimates
                    if (this._derivedLoadedFeatureCount > this._proxyWrapper.loadedFeatureCount) {
                        chunkSize -= this._derivedLoadedFeatureCount - this._proxyWrapper.loadedFeatureCount;
                    }

                    previousCount = this._proxyWrapper.loadedFeatureCount;

                    // if the actual loaded count is lower then estimated, still use the esitimated count (don't want to decrease the count)
                    // since the chunksize is reduced, the estimates will slow down
                    this._derivedLoadedFeatureCount = Math.max(
                        this._derivedLoadedFeatureCount,
                        this._proxyWrapper.loadedFeatureCount
                    );
                    if (this.loadingPanel !== undefined) {
                        this.loadingPanel.prepareBody();
                    }
                }
            }, updateDelta);
            if (this.loadingPanel !== undefined) {
                this.loadingPanel.prepareBody();
            }
            return stopInterval;
        }

        // FIXME this can probably move directly into geoApi
        getSymbol(featureAttrs) {
            return this.formattedData.then(attrSet =>
                gapiService.gapi.symbology.getGraphicIcon(featureAttrs, attrSet.renderer)
            );
        }

        /**
         * Checks if the layer controlled by the main proxy object is off scale.
         *
         * @return {Object} in the form of { offScale: <Boolean>, zoomIn: <Boolean> }
         */
        get scale() {
            return this.proxyWrapper.isOffScale();
        }

        /**
         * Zooms the layer controlled by the main proxy object in or out so features are visible on the map.
         *
         * @function zoomToScale
         * @return {Promise} resolving when the extent change has ended
         */
        zoomToScale() {
            return this.proxyWrapper.zoomToScale();
        }

        /**
         * Zooms the layer controlled by the main proxy object to its bounding box.
         *
         * @function zoomToBoundary
         * @return {Promise} resolving when the extent change has ended
         */
        zoomToBoundary() {
            return this._proxyWrapper.zoomToBoundary();
        }

        /**
         * Zooms to a graphic with the specified oid.
         *
         * @param {Number} oid object oid
         * @param {Object} offsetFraction fractions of the current extent occupied by main and data panels in the form of { x: <Number>, y: <Number> }
         * @return {Promise} a promise resolving when the extent change is comlete
         */
        zoomToGraphic(oid, offsetFraction) {
            return this.proxyWrapper.zoomToGraphic(oid, offsetFraction);
        }

        /**
         * Retrieves a graphic object from the main connected layer given the object id.
         *
         * @param {Number} oid the object id
         * @param {Object} opts options object for the graphic
         *                      - map           map wrapper object of current map. only required if requesting geometry
         *                      - geom          boolean. indicates if return value should have geometry included. default to false
         *                      - attribs       boolean. indicates if return value should have attributes included. default to false
         * @return {Promise} a promise resolving with a graphic
         */
        fetchGraphic(oid, opts) {
            return this._proxyWrapper.fetchGraphic(oid, opts);
        }

        abortAttribLoad() {
            common.$interval.cancel(this._stopFeatureCountInterval);
            this._stopFeatureCountInterval = null;
            this._derivedLoadedFeatureCount = 0;
            this._proxyWrapper.abortAttribLoad();
        }

        get description() {
            return this.blockConfig.description;
        }
        get symbologyStack() {
            return this._symbologyStack;
        }

        get metadataUrl() {
            return this.proxyWrapper.metadataUrl;
        }
        get catalogueUrl() {
            return this.proxyWrapper.catalogueUrl;
        }

        get isVisibleOnExport() {
            return (
                this.visibility &&
                !this.hidden &&
                this.opacity !== 0 &&
                (this.state === Geo.Layer.States.REFRESH || this.state === Geo.Layer.States.LOADED) &&
                !this.scale.offScale
            );
        }
    }

    // who is responsible for populating legend groups with entries? legend service or the legend group itself
    // LegendGroup needs the dynamic layer record root proxy to know when the layer fails and display the error template when this happens
    // If the layer fails on initial loading, there are no children to indicate the error state, so the error template must be displayed at the root of the dynamic record
    class LegendGroup extends LegendEntry {
        /**
         *
         * @param {EntryGroup} blockConfig the entry group config object
         * @param {ProxyWrapper} rootProxyWrapper the proxy wrapper containing the layer proxy object of a dynamic layer root
         * @param {Boolean} [isDynamicRoot=false] specifying if this group is the root of a dynamic layer
         */
        constructor(blockConfig, rootProxyWrapper = null, isDynamicRoot = false) {
            super(blockConfig);

            this._name = blockConfig.name;
            this._expanded = blockConfig.expanded;
            this._availableControls = blockConfig.controls;
            this._disabledControls = blockConfig.disabledControls;
            this._userDisabledControls = blockConfig.userDisabledControls;
            this._rootProxyWrapper = rootProxyWrapper;
            this._isDynamicRoot = isDynamicRoot;
            this._sameOpacity = true;
            this._toggled = false;

            this._aggregateStates = ref.aggregateStates;
            this._walk = ref.walkFunction.bind(this);

            if (this._rootProxyWrapper) {
                // Set LegendGroup's opacity to 1 to ensure opacity of children
                // is calculated relative to fully opaque.
                // The expected opacity is still applied to children values
                this._rootProxyWrapper.opacity = 1;
            }
        }

        get blockType() {
            return TYPES.GROUP;
        }

        // collapsed value specifies if the group node will be hidden from UI
        // in such a case, its children will appear to be on the same level as the legend group would have been
        _collapsed = false;

        get collapsed() {
            return this._collapsed;
        }
        set collapsed(value) {
            this._collapsed = value;
        }

        // TODO: this doesn't seem to be called from anywhere
        applyInitialStateSettings() {
            // this will ensure all the controlled layers settings in this group match settings of the observable entries
            this.visibility = this.visibility;
            this.opacity = this.opacity;
        }

        synchronizeControlledEntries() {
            this._activeEntries.filter(entry => entry.controlled).forEach(controlledEntry => {
                controlledEntry.visibility = this.visibility;
                controlledEntry.opacity = this.opacity;
            });
        }

        _entries = [];

        get availableControls() {
            return this._availableControls;
        }
        get disabledControls() {
            return this._disabledControls;
        }
        get userDisabledControls() {
            return this._userDisabledControls;
        }

        /**
         * @return {Boolean} true if the group is part of the user-added dynamic layer
         */
        get userAdded() {
            if (this._rootProxyWrapper) {
                return this._rootProxyWrapper.userAdded;
            }

            return false;
        }

        get state() {
            if (this._isDynamicRoot) {
                return this._rootProxyWrapper.state;
            }

            return Geo.Layer.States.LOADED;
        }

        get template() {
            const availableControls = this._availableControls;
            const collapsed = this.collapsed;

            // only add `reload` control to the available controls when the dynamic layer is loading or already failed
            // TODO would be nice if we could utilize the constants in Geo.Layer.States instead of hardcoding
            const stateToTemplate = {
                'rv-loading': () => 'placeholder',
                'rv-loaded': () => {
                    // only remove reload if it is not the dynamic root or the top-most visible level of a dynamic layer (if root collapsed)
                    if (
                        !this._isDynamicRoot &&
                        !(this.parent.blockType === LegendBlock.GROUP && this.parent.collapsed)
                    ) {
                        _removeReload();
                    } else {
                        _addReload();
                    }
                    return _collapsedCheck(super.template);
                },
                'rv-refresh': () => _collapsedCheck(super.template),
                'rv-error': () => {
                    _addReload();
                    return 'error';
                },
                'rv-bad-projection': () => {
                    _removeReload();
                    return 'bad-projection';
                }
            };

            return stateToTemplate[this.state]();

            /**
             * Adds a `reload` control to the list of available group controls.
             *
             * @function _addReload
             * @private
             */
            function _addReload() {
                const index = availableControls.indexOf('reload');

                if (index === -1) {
                    availableControls.push('reload');
                }
            }

            /**
             * Removes a `reload` control to the list of available group controls.
             *
             * @function _removeReload
             * @private
             */
            function _removeReload() {
                const index = availableControls.indexOf('reload');

                if (index !== -1) {
                    availableControls.splice(index, 1);
                }
            }

            /**
             * Checks if the group is collapsed. If so, return the name of the collapsed group template.
             *
             * @function _collapsedCheck
             * @private
             * @param {String} defaultValue the default tempalte name
             * @return {String} template name
             */
            function _collapsedCheck(defaultValue) {
                return collapsed ? 'collapsed' : defaultValue;
            }
        }

        get sortGroup() {
            return Geo.Layer.SORT_GROUPS_[Geo.Layer.Types.ESRI_DYNAMIC];
        }

        get isRefreshing() {
            return this.state === Geo.Layer.States.LOADING;
        }

        get name() {
            return this._name || this._rootProxyWrapper.name;
        }

        get visibility() {
            return this._observableEntries.some(entry => entry.visibility);
        }
        set visibility(value) {
            if (this.isControlSystemDisabled('visibility')) {
                return;
            }

            if (value) {
                // Toggle each child entry's visibility on
                this._activeEntries.forEach(entry => {
                    // If a child is a group propogate the toggled value
                    // This allows show all to effect all child groups
                    if (entry.blockType === 'group') {
                        entry._toggled = this._toggled;
                    }
                    if (entry.oldVisibility !== undefined && this._toggled) {
                        // Don't set the visibility if it doesn't change
                        // Prevents overwriting a past saved visibility state
                        if (entry.visibility !== entry.oldVisibility) {
                            entry.visibility = entry.oldVisibility;
                        }
                    } else {
                        // If there's no saved state or pressing show all set the visibility to true
                        entry.visibility = true;
                    }
                });
                this._toggled = false;
            } else {
                this._activeEntries.forEach(entry => {
                    entry.oldVisibility = entry.visibility;
                    if (entry.visibility) {
                        // Don't set the visibility if it doesn't change
                        // Prevents overwriting a past saved visibility state
                        entry.visibility = false;
                    }
                });
                this._toggled = true;
            }

            updateLegendElementVisibility(this);

            return this;
        }

        /**
         * @return {Boolean} `true` is all observed legend blocks are set to be queriable; `false` otherwise;
         */
        get query() {
            return this._observableEntries.some(entry => entry.query);
        }
        /**
         * @param {Boolean} value zxxzcs
         * @return {LegendGroup} this for chaining
         */
        set query(value) {
            if (this.isControlSystemDisabled('query')) {
                return;
            }

            this._activeEntries.forEach(entry => (entry.query = value));

            updateLegendElementQueryable(this);

            return this;
        }

        /**
         * @return {Number} returns opacity of the group;
         * it's equal to the child opacity values if they are the same or 0.5 if not;
         */
        get opacity() {
            const defaultValue = 0.5;
            const entries = this._observableEntries;

            let isAllSame = this.sameOpacity;
            let value = entries.length > 0 ? entries[0].opacity : undefined;
            return isAllSame ? value : defaultValue;
        }

        /**
         * Checks if all children have the same opacity
         *
         * @returns {Boolean} 'true' is all children have the same opacity; 'false otherwise;
         */
        get sameOpacity() {
            const entries = this._observableEntries;
            let value;

            if (entries.length > 0) {
                value = entries[0].opacity;
                // Check that they have the same opacity and if it has all the same opacity if it's a group
                this._sameOpacity = entries.every(
                    entry =>
                        entry.opacity === value && (entry._sameOpacity === undefined || entry._sameOpacity === true)
                );
            }
            return this._sameOpacity;
        }

        set opacity(value) {
            if (this.isControlSystemDisabled('opacity')) {
                return;
            }

            this._activeEntries.forEach(entry => (entry.opacity = value));

            updateLegendElementOpacity(this);

            return this;
        }

        get expanded() {
            return this._expanded;
        }
        set expanded(value = !this.expanded) {
            this._expanded = value;
            $rootScope.$applyAsync();
        }

        get entries() {
            return this._entries;
        }

        // active entries are legend blocks that directly or indirectly control map data, namely legend nodes, groups, and sets
        // active entries do not include hidden nodes
        get _activeEntries() {
            return this.entries.filter(
                entry =>
                    entry.blockType === TYPES.SET ||
                    entry.blockType === TYPES.GROUP ||
                    (entry.blockType === TYPES.NODE && !entry.hidden)
            );
        }
        get _observableEntries() {
            // observable entries are a subset of active entries which are not controlled blocks and are rendered in the UI
            // when calculating group opacity or visibility, exclude controlled layers as they might have locked opacity specified in the config
            return this._activeEntries.filter(entry => !entry.controlled);
        }

        addEntry(entry, position = this._entries.length) {
            this._entries.splice(position, 0, entry);

            entry.parent = this;

            return this;
        }

        removeEntry(entry) {
            const index = this._entries.indexOf(entry);

            if (index !== -1) {
                this._entries.splice(index, 1);
            }

            return index;
        }

        walk(...args) {
            return this._walk(...args);
        }

        get isVisibleOnExport() {
            return (
                !this.hidden &&
                this.opacity !== 0 &&
                (this.state === Geo.Layer.States.REFRESH || this.state === Geo.Layer.States.LOADED) &&
                this.entries.some(entry => entry.isVisibleOnExport)
            );
        }
    }

    class LegendSet extends LegendEntry {
        // cannot directly contain another legend set
        constructor(blockConfig) {
            super(blockConfig);

            this._entries = [];
            this._selectedEntry = null;

            this._walk = ref.walkFunction.bind(this);
        }

        // `_selectedEntry` starts as `null`, but can never go back to null after being set unless that entry is removed from the visibility group;
        // this keeps track of the last entry made visible inside the visibility group even if it's currently invisible;
        // tracking the last entry selected, allows to restore its visibility (instead of falling back to the first entry) when the legend group itself made visible by its parent;
        _selectedEntry = null;

        // sets are special snowflakes; they only support visibility controls
        // and it's not exposed in UI anyway since Sets don't have templates
        get availableControls() {
            return ['visibility'];
        }
        get disabledControls() {
            return [];
        }
        get userDisabledControls() {
            return [];
        }

        get blockType() {
            return TYPES.SET;
        }

        /**
         * @return {Boolean} true if one of the visibility group's entries is visible; false, if no entries are visible
         */
        // eslint-disable-next-line complexity
        get visibility() {
            // find a new entry selected in the visibility group by a user;
            // it must differ from the already selected entry tracked by the visibility group
            const newlySelectedEntry =
                this._activeEntries.find(entry => entry.visibility && entry !== this._selectedEntry) || null;

            // if found, hide the tracked entry, and keep the reference to the new one
            if (newlySelectedEntry) {
                if (this._selectedEntry) {
                    this._selectedEntry.visibility = false;
                }
                this._selectedEntry = newlySelectedEntry;
            }

            const anyVisible = this._activeEntries.some(entry => entry.visibility);

            // if this visiblity set is collapsed and has active entries,
            // hide all other entries except the selection one (or the first of active entreis if the selection is null)
            if (this.blockConfig.collapse && this._activeEntries.length > 0) {
                const collapsedEntry = this._selectedEntry || this._activeEntries[0];
                collapsedEntry.hidden = false;

                this._activeEntries.forEach(entry => {
                    if (entry !== collapsedEntry) {
                        entry.hidden = true;
                    }
                });
            }

            return anyVisible;
        }

        set visibility(value) {
            if (!value) {
                this._activeEntries.forEach(entry => (entry.visibility = value));
            } else if (!this.visibility && this._activeEntries.length > 0) {
                // setting the set's visibility to true when one of the entries is already visible has no effect
                // `this.visibility` will be `false` if there is no visible entries, so turning visiblity on
                // the selected entry (if available) or the first entry in the group

                (this._selectedEntry || this._activeEntries[0]).visibility = true;
            }

            updateLegendElementVisibility(this);

            return this;
        }

        get _activeEntries() {
            return this.entries.filter(entry => entry.blockType === TYPES.GROUP || entry.blockType === TYPES.NODE);
        }

        get entries() {
            return this._entries;
        }

        addEntry(entry, position = this._entries.length) {
            // since a set can have at most one visible child,
            // as soon as there is one visible chilld, turn all subsequent children off
            if (this.visibility) {
                entry.visibility = false;
            }
            this._entries.splice(position, 0, entry);

            entry.parent = this;

            return this;
        }

        // indicates if this set should be highlighted
        _highlight = false;
        set highlight(value) {
            this._highlight = value;
        }
        get highlight() {
            return this._highlight;
        }

        removeEntry(entry) {
            const index = this._entries.indexOf(entry);

            if (index !== -1) {
                this._entries.splice(index, 1);
            }

            // if the entry being remove is the selected entry, reset selected entry to null
            // when the entry is reloaded, its layer config is reused and the visibility set will change visibility of the selectedEntry false during the next digest cycle
            if (entry === this._selectedEntry) {
                this._selectedEntry = null;
            }

            return index;
        }

        walk(...args) {
            return this._walk(...args);
        }

        get isVisibleOnExport() {
            return !this.hidden && this.opacity !== 0 && this.entries.some(entry => entry.isVisibleOnExport);
        }
    }

    const service = {
        Block: LegendBlock,
        Node: LegendNode,
        Group: LegendGroup,
        Set: LegendSet,
        Info: LegendInfo,

        ProxyWrapper,

        TYPES
    };

    return service;

    /**
     * @function updateLegendElementVisibility
     * @private
     * @param {LegendBlock} block legend block where visibility is being updated
     */
    function updateLegendElementVisibility(block) {
        let legendElement;

        if (appInfo.mapi) {
            legendElement = appInfo.mapi.ui.configLegend.getById(block.id);
            if (legendElement && legendElement.visibility !== block.visibility) {
                legendElement._visibilityChanged.next(block.visibility);
            }
        }
    }

    /**
     * @function updateLegendElementOpacity
     * @private
     * @param {LegendBlock} block legend block where opacity is being updated
     */
    function updateLegendElementOpacity(block) {
        let legendElement;

        if (appInfo.mapi) {
            legendElement = appInfo.mapi.ui.configLegend.getById(block.id);
            if (legendElement && legendElement.opacity !== block.opacity) {
                legendElement._opacityChanged.next(block.opacity);
            }
        }
    }

    /**
     * @function updateLegendElementQueryable
     * @private
     * @param {LegendBlock} block legend block where queryable value is being updated
     */
    function updateLegendElementQueryable(block) {
        let legendElement;

        if (appInfo.mapi) {
            legendElement = appInfo.mapi.ui.configLegend.getById(block.id);
            if (legendElement && legendElement.queryable !== block.query) {
                legendElement._queryableChanged.next(block.query);
            }
        }
    }

    /**
     * Checks if the specified controls is visible in the UI.
     *
     * @function isControlVisible
     * @private
     * @param {String} controlName the name of the control to be checked
     * @return {Boolean} true if the control specified should be visible in the UI
     */
    function isControlVisible(controlName) {
        return this.availableControls.indexOf(controlName) !== -1;
    }

    /**
     * Checks if the speicified controls is disabled in the UI.
     *
     * @function isControlDisabled
     * @private
     * @param {String} controlName the name of the control to be checked
     * @return {Boolean} true if the control specified should be disabled in the UI
     */
    function isControlDisabled(controlName) {
        return this.isControlSystemDisabled(controlName) || this.isControlUserDisabled(controlName);
    }

    /**
     * Checks if the specified control is locked from modification by the system and user.
     *
     * @function isControlSystemDisabled
     * @private
     * @param {String} controlName the name of the control to be checked
     * @return {Boolean} true if the control specified is locked from modifications by the system and user
     */
    function isControlSystemDisabled(controlName) {
        return this.disabledControls.indexOf(controlName) !== -1;
    }

    /**
     * Checks if the specified control is locked from modification by the user.
     *
     * @function isControlUserDisabled
     * @private
     * @param {String} controlName the name of the control to be checked
     * @return {Boolean} true if the control specified is locked from modifications by user but can be changed by the system
     */
    function isControlUserDisabled(controlName) {
        return this.userDisabledControls.indexOf(controlName) !== -1;
    }

    /**
     * Given an array of proxy states, returns the aggregates state using the following rules:
     * - `rv-error` if at least one proxy is errored
     * - `rv-bad-projection` if none is errored, but at least one is not supported in the current projection
     * - `rv-loading` if none is errored, all supported in the current projection, but at least one is loading
     * - `rv-refresh` if none is errored or loading, all supported in the current projection, but at least one is refreshing
     * - `rv-loaded` if all proxies are loaded
     *
     * @function aggregateStates
     * @private
     * @param {Array} states an Array of strings representing states of all the proxies belonging to the legend block
     * @return {String} the aggregated state of the states supplied
     */
    function aggregateStates(states) {
        const stateNames = [Geo.Layer.States.ERROR, Geo.Layer.States.BAD_PROJECTION, Geo.Layer.States.LOADING,
            Geo.Layer.States.REFRESH, Geo.Layer.States.LOADED];

        const stateValues = stateNames.map(name => states.indexOf(name) !== -1);

        return stateNames[stateValues.indexOf(true)];
    }

    /**
     * Walks the legend block hierarchy executing `action` with each block and returning a flattened array of results.
     * For legend block containing children, a `decision` function is called to decide whether to proceed walking down its children.
     *
     * @function walkFunction
     * @private
     * @param {Function} action this will be called with every legend block and its children and the function returns flattened into an array and returned
     * @param {Function} decision [optional = null] if a legendBlock has children (group or set), this function is called to decide whether to walk block's children or not;
     * if this returns true, the children of the group/set are passed to the `action` function
     * @return {Array} a flattened array of results from the `action` function when executed with all the legend blocks
     */
    function walkFunction(action, decision = null) {
        // roll in the results into a flat array
        return [].concat.apply(
            [],
            this.entries.map((entry, index) => {
                if (entry.blockType === TYPES.GROUP || entry.blockType === TYPES.SET) {
                    const actionResult = action(entry, index, this);
                    const walkResult = [];
                    const proceed = decision ? decision(entry, index, this) : true;

                    if (proceed) {
                        walkResult.push.apply(walkResult, entry.walk(action, decision));
                    }

                    return [].concat(actionResult, walkResult);
                } else {
                    return action(entry, index, this);
                }
            })
        );
    }
}
