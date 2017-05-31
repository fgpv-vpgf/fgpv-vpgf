/**
 * @module LegendBlockFactory
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 *
 */
angular
    .module('app.geo')
    .factory('LegendBlock', LegendBlockFactory);

function LegendBlockFactory($q, Geo, layerRegistry, gapiService, configService, SymbologyStack) {

    let legendBlockCounter = 0;

    const ref = {
        walkFunction,
        aggregateStates,

        isControlVisible,
        isControlDisabled,
        isControlSystemDisabled,
        isControlUserDisabled
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
        constructor(proxy, layerConfig) {
            this._proxy = proxy;
            this._layerConfig = layerConfig;

            this.isControlVisible = ref.isControlVisible.bind(this);
            this.isControlDisabled = ref.isControlDisabled.bind(this);
            this.isControlSystemDisabled = ref.isControlSystemDisabled.bind(this);
            this.isControlUserDisabled = ref.isControlUserDisabled.bind(this);

            this._initialStateSettingsApplied = false;
        }

        /**
         * @return {Proxy} original gapi proxy object
         */
        get proxy () { return this._proxy; }
        /**
         * @return {LayerNode} original typed layer config object
         */
        get layerConfig () { return this._layerConfig; }

        /**
         * This will apply initial state values from the layer config object to the layer proxy object.
         * This is needed to apply state settings that are not set in geoApi (dynamic layers, for example, start up as fully invisible to prevent flicker on initial load).
         *
         * @function applyInitialStateSettings
         */
        applyInitialStateSettings() {
            if (this._initialStateSettingsApplied) {
                return;
            }

            this._proxy.setOpacity(this._layerConfig.state.opacity);
            this._proxy.setVisibility(this._layerConfig.state.visibility);
            this._proxy.setQuery(this._layerConfig.state.query);

            this._initialStateSettingsApplied = true;
        }

        get initialStateSettingsApplied () { return this._initialStateSettingsApplied }

        zoomToBoundary(...args) {          this._proxy.zoomToBoundary(...args); }

        get state () {              return this._proxy.state; }
        get name () {               return (this._proxy || this._layerConfig).name; }
        get layerType () {          return this._proxy.layerType; }
        get featureCount () {       return this._proxy.featureCount; }
        get geometryType () {       return this._proxy.geometryType; }
        get extent () {             return this._proxy.extent; }
        get symbology() {           return this._proxy.symbology; }
        get formattedAttributes() { return this._proxy.formattedAttributes; }

        get opacity () {            return this._proxy.opacity; }
        get visibility () {         return this._proxy.visibility; }
        get query () {              return this._proxy.query; }
        get snapshot () {           return this._layerConfig.state.snapshot; }
        get boundingBox () {        return this._layerConfig.state.boundingBox; }

        set opacity (value) {
            if (this.isControlSystemDisabled('opacity')) {
                return;
            }

            this._proxy.setOpacity(value);
        }
        set visibility (value) {
            if (this.isControlSystemDisabled('visibility')) {
                return;
            }

            this._proxy.setVisibility(value);
        }
        set query (value) {
            if (this.isControlSystemDisabled('query')) {
                return;
            }

            // bounding box belongs to the LegendBlock, not ProxyWrapper;
            // so, setting boundingBox value doesn't call the proxy object,
            // it just stores the value in the layer config state for future bookmark use
            this._proxy.setQuery(value);
        }
        set boundingBox (value) {
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
        set snapshot (value) {          this._layerConfig.state.snapshot = value; }

        get metadataUrl () {            return this._layerConfig.metadataUrl; }
        get catalogueUrl () {           return this._layerConfig.catalogueUrl; }

        get availableControls () {      return this._layerConfig.controls; }
        get disabledControls () {       return this._layerConfig.disabledControls; }
        get userDisabledControls () {   return this._layerConfig.userDisabledControls; }
    }

    class LegendBlock {
        constructor (blockConfig) {
            this._blockConfig = blockConfig;

        }

        _controlled = false;

        get isInteractive () {          return false; }

        get id () {
            if (!this._id) {
                this._id = `${this.blockType}_${++legendBlockCounter}`;
            }

            return this._id;
        }

        get blockConfig () {            return this._blockConfig; }
        get template () {               return this.blockType; }

        /**
         * @param {Boolean} value specifies if the LegendBlock is directly controlled by a parent LegendBlock and has no visible UI
         */
        set controlled (value) {        this._controlled = value; }
        /**
         * @returns {Boolean} returns true if the LegendBlock is directly controlled by a parent LegendBlock and has no visible UI
         */
        get controlled () {             return this._controlled; }

        static INFO = 'info';
        static NODE = 'node';
        static GROUP = 'group';
        static SET = 'set';
    }

    class LegendInfo extends LegendBlock {
        constructor(blockConfig) {
            super(blockConfig);

            this._symbologyStack =
                new SymbologyStack({}, blockConfig.symbologyStack, this.symbologyRenderStyle, true);
        }

        get blockType () {              return TYPES.INFO; }

        get infoType () {               return this.blockConfig.infoType; }
        get content () {                return this.blockConfig.content; }

        get layerName () {              return this.blockConfig.layerName; }
        get symbologyStack () {         return this._symbologyStack; }
        get symbologyRenderStyle () {   return this.blockConfig.symbologyRenderStyle; }
    }

    // can be node or group
    class LegendEntry extends LegendBlock {

        constructor(blockConfig) {
            super(blockConfig);

            this.isControlVisible = ref.isControlVisible.bind(this);
            this.isControlDisabled = ref.isControlDisabled.bind(this);
            this.isControlSystemDisabled = ref.isControlSystemDisabled.bind(this);
            this.isControlUserDisabled = ref.isControlUserDisabled.bind(this);
        }

        get isInteractive () {          return true; }

        _isSelected = false;

        _layerRecordId = null;

        get isSelected () {             return this._isSelected; }
        set isSelected (value) {        this._isSelected = value; }

        /**
         * @return {String} id of the layer bound to this legend block; this will be used in reordering and reloading
         */
        set layerRecordId (value) {     this._layerRecordId = value; }
        /**
         * @param {String} value id of the layer bound to this legend block; this will be used in reordering and reloading
         */
        get layerRecordId () {
            if (this._layerRecordId === null) {
                console.error('layerRecordId must be set on all LegendBlocks which can be reloaded or reordered');
            }

            return this._layerRecordId;
        }
    }

    class LegendNode extends LegendEntry {

        constructor(mainProxyWrapper, blockConfig) {
            super(blockConfig);

            this._mainProxyWrapper = mainProxyWrapper;
            this._controlledProxyWrappers = [];

            this._aggregateStates = ref.aggregateStates;
            this._symbologyStack = new SymbologyStack(
                this.mainProxy, blockConfig.symbologyStack, blockConfig.symbologyRenderStyle, true);
        }

        /**
         * @return {Proxy} the main proxy connected to the legend block
         */
        get mainProxy () { return this._mainProxyWrapper.proxy; }

        addControlledProxyWrapper(proxyWrapper) {
            this._controlledProxyWrappers.push(proxyWrapper);
        }

        applyInitialStateSettings() {
            if (!this._mainProxyWrapper.initialStateSettingsApplied) {
                this._mainProxyWrapper.applyInitialStateSettings();

                // bounding box is not linked to a proxy, so we need to apply it separately
                this.boundingBox = this._mainProxyWrapper.boundingBox;
            }
        }

        /**
         * Synchonizes opacity and visiblity values of the controlled proxies to the main proxy connected to this legend block.
         *
         * @function synchronizeControlledProxyWrappers
         */
        synchronizeControlledProxyWrappers() {
            this._controlledProxyWrappers
                .forEach(proxyWrapper => {
                    proxyWrapper.visibility = this.visibility;
                    proxyWrapper.opacity = this.opacity;
                })
        }

        set reloadConfig (value) {      this._reloadConfig = value; }
        get reloadConfig () {           return this._reloadConfig; }

        get blockType () {              return TYPES.NODE; }

        get _allProxyWrappers () {      return [this._mainProxyWrapper].concat(this._controlledProxyWrappers); }

        get availableControls () {      return this._mainProxyWrapper.availableControls; }
        get disabledControls () {       return this._mainProxyWrapper.disabledControls; }
        get userDisabledControls () {   return this._mainProxyWrapper.userDisabledControls; }

        get state () {
            const allStates = this._allProxyWrappers.map(proxyWrapper =>
                proxyWrapper.state);
            const combinedState = this._aggregateStates(allStates);

            return combinedState;
        }

        get template () {
            const stateToTemplate = {
                'rv-loading': () => 'placeholder',
                'rv-loaded': () => super.template,
                'rv-refresh': () => super.template,
                'rv-error': () => 'error'
            };

            return stateToTemplate[this.state]();
        }

        get isRefreshing () {
            const state = this.state;

            return state === 'rv-loading' || state === 'rv-refresh';
        }

        get sortGroup () {          return Geo.Layer.SORT_GROUPS_[this._mainProxyWrapper.layerType]; }

        get name () {               return this._mainProxyWrapper.name; }
        get layerType () {          return this._mainProxyWrapper.layerType; }
        get featureCount () {       return this._mainProxyWrapper.featureCount; }
        get geometryType () {       return this._mainProxyWrapper.geometryType; }

        get visibility () {         return this._mainProxyWrapper.visibility; }
        set visibility (value) {
            if (this.isControlSystemDisabled('visibility')) {
                return;
            }

            this._allProxyWrappers.forEach(proxyWrapper =>
                (proxyWrapper.visibility = value)
            );

            // hide bounding box when the layer goes invisible
            if (!value) {
                this.boundingBox = false;
            }
        }

        get opacity () {            return this._mainProxyWrapper.opacity; }
        set opacity (value) {
            if (this.isControlSystemDisabled('opacity')) {
                return;
            }

            this._allProxyWrappers.forEach(proxyWrapper =>
                (proxyWrapper.opacity = value)
            );
        }

        // since query is applied only on the main proxy wrapper, we don't need to do an extra check if this control is available; it will be checked in the proxy wrapper
        get query () {              return this._mainProxyWrapper.query; }
        set query (value) {         this._mainProxyWrapper.query = value; }

        get snapshot () {           return this._mainProxyWrapper.snapshot; }
        /**
         * Setting snapshot to `true` is permanent - if a snapshoted layer is reloaded manually in the future, it reloads as a snapshoted layer.
         * @param {Boolean} value specified layer's snapshot value
         */
        set snapshot (value) {      this._mainProxyWrapper.snapshot = value; }

        /**
         * Creates and stores (if missing) a boundign box based on the full extent exposed by the proxy object.
         *
         * @function _makeBbox
         * @private
         */
        _makeBbox () {
            if (!this._bboxProxy) {
                // if chaning id prefix, update the corresponding css rule to make bboxes click-through
                this._bboxProxy = layerRegistry
                    .makeBoundingBoxRecord(`${this.id}_bbox`, this._mainProxyWrapper.extent);
            }
        }
        get boundingBox () {
            if (!this._mainProxyWrapper.extent) {
                return false;
            }

            if (!this._bboxProxy) {
                return false;
            }

            return this._bboxProxy.visible;
        }
        set boundingBox (value) {
            if (!this._bboxProxy) {
                if (value) {
                    this._makeBbox();
                } else {
                    return;
                }
            }

            this._bboxProxy.setVisibility(value);
            this._mainProxyWrapper.boundingBox = value;
        }

        get userAdded () {
            return this._blockConfig.userAdded;
        }

        get formattedData () {
            return this._mainProxyWrapper.formattedAttributes;
        }

        // FIXME this can probably move directly into geoApi
        getSymbol(featureAttrs) {
            return this.formattedData.then(attrSet =>
                gapiService.gapi.symbology.getGraphicIcon(featureAttrs, attrSet.renderer));
        }

        zoomToBoundary () {
            this._mainProxyWrapper.zoomToBoundary(configService.getSync.map.instance);
        }

        get symbologyStack () {     return this._symbologyStack; }

        get metadataUrl () {        return this._mainProxyWrapper.metadataUrl; }
        get catalogueUrl () {       return this._mainProxyWrapper.catalogueUrl; }
    }

    // who is responsible for populating legend groups with entries? legend service or the legend group itself
    // LegendGroup needs the dynamic layer record root proxy to know when the layer fails and display the error template when this happens
    // If the layer fails on initial loading, there are no children to indicate the error state, so the error template must be displayed at the root of the dynamic record
    class LegendGroup extends LegendEntry {

        constructor(blockConfig, rootProxyWrapper = null) {
            super(blockConfig);

            this._name = blockConfig.name;
            this._expanded = blockConfig.expanded;
            this._availableControls = blockConfig.controls;
            this._disabledControls = blockConfig.disabledControls;
            this._userDisabledControls = blockConfig.userDisabledControls;
            this._rootProxyWrapper = rootProxyWrapper;

            this._aggregateStates = ref.aggregateStates;
            this._walk = ref.walkFunction.bind(this);
        }

        get blockType () { return TYPES.GROUP; }

        applyInitialStateSettings() {
            // this will ensure all the controlled layers settings in this group match settings of the observable entries
            this.visibility = this.visibility;
            this.opacity = this.opacity;
        }

        synchronizeControlledEntries() {
            // const visibility = this.visibility;

            this._activeEntries
                .filter(entry =>
                    entry.controlled)
                .forEach(controlledEntry => {
                    controlledEntry.visibility = this.visibility;
                    controlledEntry.opacity = this.opacity;
                })
        }

        _entries = [];

        get availableControls () {      return this._availableControls; }
        get disabledControls () {       return this._disabledControls; }
        get userDisabledControls () {   return this._userDisabledControls; }

        get state () {
            if (this._rootProxyWrapper) {
                return this._rootProxyWrapper.state;
            } else {
                return 'rv-loaded';
            }
        }

        get template () {
            const availableControls = this._availableControls;

            // only add `reload` control to the available controls when the dynamic layer is loading or already failed
            const stateToTemplate = {
                'rv-loading': () => {
                    _addReload();
                    return 'placeholder';
                },
                'rv-loaded': () => {
                    _removeReload()
                    return super.template;
                },
                'rv-refresh': () => {
                    _removeReload()
                    return super.template;
                },
                'rv-error': () => {
                    _addReload();
                    return 'error';
                }
            };

            return stateToTemplate[this.state]();

            function _addReload() {
                availableControls.push('reload');
            }

            function _removeReload() {
                const index = availableControls.indexOf('reload');

                if (index !== -1) {
                    availableControls.splice(index, 1);
                }
            }
        }

        get sortGroup () {              return Geo.Layer.SORT_GROUPS_[Geo.Layer.Types.ESRI_DYNAMIC]; }

        get isRefreshing () {
            return this.state === 'rv-loading';
        }

        get name () {                   return this._name; }

        get visibility () {
            return this._observableEntries.some(entry =>
                entry.visibility);
        }
        set visibility (value) {
            if (this.isControlSystemDisabled('visibility')) {
                return;
            }

            this._activeEntries.forEach(entry =>
                (entry.visibility = value));

            return this;
        }

        /**
         * @return {Number} returns opacity of the group;
         * it's equal to the child opacity values if they are the same or 0.5 if not;
         * TODO: might want to add a description what 0.5 value means in such cases;
         */
        get opacity () {
            const defaultValue = 0.5;
            let isAllSame = false;

            const entries = this._observableEntries;
            let value;

            if (entries.length > 0) {
                value = entries[0].opacity;
                isAllSame = entries.every(entry =>
                    entry.opacity === value);
            }

            return isAllSame ? value : defaultValue;
        }

        set opacity (value) {
            if (this.isControlSystemDisabled('opacity')) {
                return;
            }

            this._activeEntries.forEach(entry =>
                (entry.opacity = value));

            return this;
        }

        get expanded () {               return this._expanded; }
        set expanded (value = !this.expanded) {
            this._expanded = value;
        }

        get entries () {                return this._entries; }
        get _activeEntries () {
            return this.entries
                .filter(entry =>
                    entry.blockType === TYPES.SET ||
                    entry.blockType === TYPES.GROUP ||
                    entry.blockType === TYPES.NODE);
        }
        get _observableEntries () {
            // when calculating group opacity or visibility, exclude controlled layers as they might have locked opacity specified in the config
            return this._activeEntries.filter(entry =>
                !entry.controlled);
        }

        addEntry (entry, position = this._entries.length) {
            this._entries.splice(position, 0, entry);

            return this;
        }

        removeEntry (entry) {
            const index = this._entries.indexOf(entry);

            if (index !== -1) {
                this._entries.splice(index, 1);
            }

            return index;
        }

        walk (...args) {
            return this._walk(...args);
        }
    }

    class LegendSet extends LegendEntry {
        // cannot directly contain another legend set
        constructor(blockConfig) {
            super(blockConfig);

            this._entries = [];
            this._entryWatchers = [];
            this._selectedEntry = null;

            this._walk = ref.walkFunction.bind(this);
        }

        _highlightSet = false;
        _selectedEntry = null;

        // sets are special snowflakes; they only support visibility controls
        // and it's not exposed in UI anyway since Sets don't have templates
        get availableControls () {      return ['visibility']; }
        get disabledControls () {       return []; }
        get userDisabledControls () {   return []; }

        get blockType () { return TYPES.SET; }

        get visibility () {
            const currentlySelected = this._activeEntries.find(entry =>
                entry.visibility && entry !== this._selectedEntry) || null;

            if (currentlySelected) {
                if (this._selectedEntry) {
                    this._selectedEntry.visibility = false;
                }
                this._selectedEntry = currentlySelected;
            }

            const isAllOff = this._activeEntries.every(entry =>
                !entry.visibility);

            if (isAllOff) {
                if (this._selectedEntry) {
                    this._selectedEntry.visibility = false;
                }
                this._selectedEntry = null;
            }

            return this._selectedEntry !== null;
        }
        set visibility (value) {
            if (!value) {
                this._activeEntries.forEach(entry =>
                    (entry.visibility = value));
            } else if (!this.visibility) {
                // setting the set's visibility to true when one of the entries is already visible has no effect
                // `this.visibility` will be `false` if there is no entries, so calling [0] should be safe
                this._activeEntries[0].visibility = true;
            }

            return this;
        }

        _propagateVisibility(value, except = null) {
            this._activeEntries.forEach(entry => {
                if (entry !== except) {
                    entry.visibility = value;
                }
            });
        }

        get _activeEntries () {
            return this.entries.filter(entry =>
                entry.blockType === TYPES.GROUP ||
                entry.blockType === TYPES.NODE);
        }
        get entries () { return this._entries; }
        addEntry (entry, position = this._entries.length) {
            // since a set can have at most one visible child,
            // as soon as there is one visible chilld, turn all subsequent children off
            if (this.visibility) {
                entry.visibility = false;
            }
            this._entries.splice(position, 0, entry);

            // LegendSet and the contained LegendBlock object will share a reference to `highlightSet` property
            // which the legend block temlate will use to highlight set elements when hovered/focused
            const highlightSetDescriptor = {
                get: () =>
                    this._highlightSet,
                set: value => {
                    this._highlightSet = value;
                }
            };

            Object.defineProperty(entry, 'highlightSet', highlightSetDescriptor);

            entry.highlightSet = false;

            return this;
        }

        get highlightSet() { return this._highlightSet; }

        removeEntry (entry) {
            const index = this._entries.indexOf(entry);

            if (index !== -1) {
                this._entries.splice(index, 1);
            }

            return index;
        }

        walk (...args) {
            return this._walk(...args);
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
        return this.disabledControls.indexOf(controlName) !== -1;
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
        return this.isControlDisabled(controlName);
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
     * - `rv-loading` if none is errored, but at least one is loading
     * - `rv-refresh` if none is errored or loading, but at least one is refreshing
     * - `rv-loaded` if all proxies are loaded
     *
     * @function aggregateStates
     * @private
     * @param {Array} states an Array of strings representing states of all the proxies belonging to the legend block
     * @return {String} the aggregated state of the states supplied
     */
    function aggregateStates(states) {
        const stateNames = ['rv-error', 'rv-loading', 'rv-refresh', 'rv-loaded'];

        const stateValues = stateNames.map(name =>
            states.indexOf(name) !== -1);

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
        return [].concat.apply([], this.entries.map((entry, index) => {
            if (entry.blockType === TYPES.GROUP ||
                entry.blockType === TYPES.SET) {

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
        }));
    }
}
