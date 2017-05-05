(() => {
    'use strict';

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

    function LegendBlockFactory($q, Geo, common, layerRegistry, gapiService, configService) {

        let legendBlockCounter = 0;

        const ref = {
            walkFunction,
            aggregateStates,
            getPropertyDescriptor,

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

        class SymbologyStack {
            constructor(proxyWrapper, blockConfig, isInteractive = false) {
                this._proxyWrapper = proxyWrapper;
                this._blockConfig = blockConfig;
                this._isInteractive = isInteractive;
            }

            get isInteractive () {  return this._isInteractive; }

            _fannedOut = false; // jshint ignore:line
            _expanded = false; // jshint ignore:line

            get stack () {          return this._proxyWrapper.symbology || this._blockConfig.symbologyStack; }
            get renderStyle () {    return this._blockConfig.symbologyRenderStyle; }

            get fannedOut () {      return this._fannedOut; }
            set fannedOut (value = !this.fannedOut) {
                this._fannedOut = value;
            }

            get expanded () {       return this._expanded; }
            set expanded (value = !this.expanded) {
                this._expanded = value;
            }
        }

        class ProxyWrapper {
            constructor(proxy, layerConfig) {
                this._proxy = proxy;
                this._layerConfig = layerConfig;

                this.isControlVisible = ref.isControlVisible.bind(this);
                this.isControlDisabled = ref.isControlDisabled.bind(this);
                this.isControlSystemDisabled = ref.isControlSystemDisabled.bind(this);
                this.isControlUserDisabled = ref.isControlUserDisabled.bind(this);

                this._isInitialStateSettingsApplied = false;
            }

            applyInitialStateSettings() {
                if (this._isInitialStateSettingsApplied) {
                    return;
                }

                this._proxy.setOpacity(this._layerConfig.state.opacity);
                this._proxy.setVisibility(this._layerConfig.state.visibility);

                this._isInitialStateSettingsApplied = true;
            }

            get isInitialStateSettingsApplied () { return this._isInitialStateSettingsApplied }

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
            get query () {              return this; }
            get snapshot () {           return this._layerConfig.state.snapshot; }
            get boundingBox () {        return this._layerConfig.state.boundingBox; }
            // bounding box belongs to the LegendBlock, not ProxyWrapper

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
            set query (value) {             this._ = value; }
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
            }

            get blockType () {              return TYPES.INFO; }

            get infoType () {               return this.blockConfig.infoType; }
            get content () {                return this.blockConfig.content; }
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
                this._symbologyStack =
                    new SymbologyStack(this._mainProxyWrapper, blockConfig, true);
            }

            addControlledProxyWrapper(proxyWrapper) {
                this._controlledProxyWrappers.push(proxyWrapper);
            }

            reApplyStateSettings() {
                if (!this._mainProxyWrapper.isInitialStateSettingsApplied) {
                    this.boundingBox = this._mainProxyWrapper.boundingBox;

                    // TODO: uncomment thid when query is supported
                    // this.query = this._mainProxyWrapper.query;

                    // initial snapshot should be handled by geoapi
                }

                this._allProxyWrappers.map(proxyWrapper =>
                    proxyWrapper.applyInitialStateSettings());
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

            get snapshot () {           return this._mainProxyWrapper.snapshot; }
            set snapshot (value) {      this._mainProxyWrapper.snapshot = value; }

            /**
             * Creates and stores (if missing) a boundign box based on the full extent exposed by the proxy object.
             *
             * @function _makeBbox
             * @private
             * @return
             */
            _makeBbox () {
                if (!this._bboxProxy) {
                    // if chaning id prefix, update the corresponding css rule to make bboxes click-through
                    this._bboxProxy = layerRegistry
                        .makeBoundingBoxRecord(`${this.id}_bbox`, this._mainProxyWrapper.extent);
                }
            }
            get boundingBox () {
                // TODO: is extent always defined?
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

            reApplyStateSettings() {
                // this will ensure all the controlled layers settings in this group match settings of the observable entries
                this.visibility = this.visibility;
                this.opacity = this.opacity;
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

            get blockType () { return TYPES.SET; }

            _highlightSet = false;

            // sets are special snowflakes; they only support visibility controls
            // and it's not exposed in UI anyway since Sets don't have templates
            get availableControls () {      return ['visibility']; }
            get disabledControls () {       return []; }
            get userDisabledControls () {   return []; }

            _decorateDescriptor(prototype, propertyName, decorator) {
                const descriptor = getPropertyDescriptor(prototype, propertyName);
                let method;

                _updateProperty('set');
                _updateProperty('get');

                return descriptor;

                function _updateProperty(name) {
                    if (decorator[name]) {
                        method = descriptor[name] || angular.noop;
                        descriptor[name] = function (value) {
                            decorator[name](value);
                            method.call(this, value);
                        };
                    }
                }
            }

            get blockType () { return TYPES.SET; }

            get visibility () {
                return this._activeEntries.some(entry =>
                    entry.visibility);
            }
            set visibility (value) {
                if (!value) {
                    this._activeEntries.forEach(entry =>
                        (entry.visibility = value));
                } else if (!this.visibility) {
                    // setting the set's visibility to true when one of the entries is alreayd visible has no effect
                    // `this.visibility` will be `false` if there is no entries, so calling [0] should be safe
                    this._activeEntries[0].visibility = true;
                }

                return this;
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

                // used to propagate positive visibility change up to the containing LegendSet object to turn off all other entries
                const visibilityDecorator = {
                    set: value => {
                        if (value) {
                            this.visibility = false;
                        }}
                };

                const visibilityPrototype = entry.blockType === TYPES.NODE ?
                    LegendNode.prototype : LegendGroup.prototype;

                const visibilityDescriptor =
                    this._decorateDescriptor(visibilityPrototype, 'visibility', visibilityDecorator);

                // LegendSet and the contained LegendBlock object will share a reference to `highlightSet` property
                // which the legend block temlate will use to highlight set elements when hovered/focused
                const highlightSetDescriptor = {
                    get: () =>
                        this._highlightSet,
                    set: value => {
                        this._highlightSet = value;
                    }
                };

                Object.defineProperty(entry, 'visibility', visibilityDescriptor);
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
         *
         * @param {String} controlName
         * @return {Boolean} true if the control specified should be visible in UI
         */
        function isControlVisible(controlName) {
            return this.availableControls.indexOf(controlName) !== -1;
        }

        /**
         *
         * @param {String} controlName
         * @return {Boolean} true if the control specified should be disabled in UI
         */
        function isControlDisabled(controlname) {
            return this.disabledControls.indexOf(controlname) !== -1;
        }

        /**
         *
         * @param {String} controlName
         * @return {Boolean} true if the control specified is locked to modifications by the system and user
         */
        function isControlSystemDisabled(controlName) {
            return this.isControlDisabled(controlName);
        }

        /**
         *
         * @param {String} controlName
         * @return {Boolean} true if the control specified is locked to modifications by user but can be changed by the system
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

        /**
         * Returns a property descritpion of the specified object.
         *
         * @function getPropertyDescriptor
         * @private
         * @param {Object} obj object to get a descript from; usually a prototype
         * @param {String} property property name
         */
        function getPropertyDescriptor(obj, property) {
            if (obj === null) {
                return null;
            }

            const descriptor = Object.getOwnPropertyDescriptor(obj, property);

            if (obj.hasOwnProperty(property)) {
                return Object.getOwnPropertyDescriptor(obj, property);
            } else {
                return getPropertyDescriptor(Object.getPrototypeOf(obj), property);
            }
        }
    }
})();
