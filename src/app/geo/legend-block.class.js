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

    function LegendBlockFactory($q, common, layerRegistry, configService) {

        let legendBlockCounter = 0;

        const ref = {
            walkFunction,
            aggregateStates,
            getPropertyDescriptor
        };

        const TYPES = {
            INFO: 'info',
            NODE: 'node',
            GROUP: 'group',
            SET: 'set'
        };

        class SymbologyStack {
            constructor(proxy, blockConfig, isInteractive = false) {
                this._proxy = proxy;
                this._blockConfig = blockConfig;
                this._isInteractive = isInteractive;
            }

            get isInteractive () {  return this._isInteractive; }

            _fannedOut = false; // jshint ignore:line
            _expanded = false; // jshint ignore:line

            get stack () {          return this._proxy.symbology || this._blockConfig.symbologyStack; }
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

        /* -------- */
        class LegendBlock {
            constructor (layerProxy, blockConfig) {

                // this._id = `${this.blockType}_${++legendBlockCounter}`;

                // this._layerProxy = layerProxy;
                this._blockConfig = blockConfig;

                /*Object.defineProperty(this._layerProxy.main, 'isRefreshing', {
                    get: () => false,
                    enumerable: true,
                    configurable: true
                });*/
            }

            // _id;
            // _layerProxy;

            get isInteractive () { return false; }

            get id () {
                if (!this._id) {
                    this._id = `${this.blockType}_${++legendBlockCounter}`;
                }

                return this._id;
            }

            // get layerProxy () {     return this._layerProxy; }

            get blockConfig () {    return this._blockConfig; }
            // get blockType () {      return this._blockType; }
            get template () {       return this.blockType; }

            static INFO = 'info'; // jshint ignore:line
            static NODE = 'node'; // jshint ignore:line
            static GROUP = 'group'; // jshint ignore:line
            static SET = 'set'; // jshint ignore:line
        }

        class LegendInfo extends LegendBlock {
            constructor(blockConfig) {
                super({}, blockConfig);
            }

            get blockType () { return TYPES.INFO; }

            get infoType () {   return this.blockConfig.infoType; }
            get content () {    return this.blockConfig.content; }
        }

        // can be node or group
        class LegendEntry extends LegendBlock {

            constructor(...args) {
                super(...args);
            }

            get isInteractive () { return true; }

            _isSelected = false;

            get isSelected () {         return this._isSelected; }
            set isSelected (value) {      this._isSelected = value; return this; }

            isControlVisible(controlName) {
                return this.availableControls.indexOf(controlName) !== -1;
            }

            isControlDisabled(controlname) {
                return this.disabledControls.indexOf(controlname) !== -1;
            }

            isControlSystemDisabled(controlName) {
                const value =
                    this.isControlDisabled(controlName) ||
                    !this.isControlVisible(controlName);

                return value;
            }

            isControlUserDisabled(controlName) {
                return this.userDisabledControls.indexOf(controlName) !== -1;
            }
        }

        class LegendNode extends LegendEntry {

            constructor(proxies, blockConfig, layerConfig) {
                super({}, blockConfig);

                this._mainProxy = proxies.main;
                this._controlledProcies = proxies.adjunct;

                this._layerConfig = layerConfig;

                this._aggregateStates = ref.aggregateStates;
                this._symbologyStack =
                    new SymbologyStack(this._mainProxy, blockConfig, true);
            }

            get blockType () { return TYPES.NODE; }

            get _allProxies () {            return [this._mainProxy].concat(this._controlledProcies); }

            get availableControls () {      return this._layerConfig.controls; }
            get disabledControls () {       return this._layerConfig.disabledControls; }
            get userDisabledControls () {   return this._layerConfig.userDisabledControls; }

            get state () {
                const allStates = this._allProxies.map(proxy => proxy.state);
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

            get name () {               return (this._mainProxy || this._config).name; }
            get layerType () {          return this._mainProxy.layerType; }
            get featureCount () {       return this._mainProxy.featureCount; }
            get geometryType () {       return this._mainProxy.geometryType; }

            get visibility () {         return this._mainProxy.visibility; }
            set visibility (value) {
                if (this.isControlSystemDisabled('visibility')) {
                    return;
                }

                this._allProxies.forEach(proxy => {
                    // TODO: try/catch
                    proxy.setVisibility(value);
                });

                // hide bounding box when the layer goes invisible
                if (!value) {
                    this.boundingBox = false;
                }

                return this;
            }

            get opacity () {            return this._mainProxy.opacity; }
            set opacity (value) {
                if (this.isControlSystemDisabled('opacity')) {
                    return;
                }

                this._allProxies.forEach(proxy => {
                    // TODO: try/catch
                    proxy.setOpacity(value);
                });

                return this;
            }

            /**
             * Creates and stores (if missing) a boundign box based on the full extent exposed by the proxy object.
             *
             * @function _makeBbox
             * @private
             * @return
             */
            _makeBbox () {
                if (!this._bboxProxy) {
                    this._bboxProxy = layerRegistry.makeBoundingBoxRecord(`${this.id}_bbox`, this._mainProxy.extent);
                }
            }
            get boundingBox () {
                // TODO: is extent always defined?
                if (!this._mainProxy.extent) {
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
                return this._mainProxy.formattedAttributes;
            }

            zoomToBoundary () {
                this._mainProxy.zoomToBoundary(configService._sharedConfig_.map.body);
            }

            get symbologyStack () {     return this._symbologyStack; }

            get metadataUrl () {        return this._layerConfig.metadataUrl; }
            get catalogueUrl () {       return this._layerConfig.catalogueUrl; }
        }

        // who is responsible for populating legend groups with entries? legend service or the legend group itself
        class LegendGroup extends LegendEntry {

            constructor(blockConfig) {
                super();

                this._name = blockConfig.name;
                this._expanded = blockConfig.expanded;
                this._availableControls = blockConfig.controls;
                this._disabledControls = blockConfig.disabledControls;
                this._userDisabledControls = blockConfig.userDisabledControls;

                this._aggregateStates = ref.aggregateStates;
                this._walk = ref.walkFunction.bind(this);
            }

            get blockType () { return TYPES.GROUP; }

            _entries = [];

            get availableControls () {      return this._availableControls; }
            get disabledControls () {       return this._disabledControls; }
            get userDisabledControls () {   return this._userDisabledControls; }

            get state () {
                if (this.entries.length === 0) {
                    return 'rv-loading';
                } else {
                    return 'rv-loaded';
                }
            }

            get template () {
                const stateToTemplate = {
                    'rv-loading': () => 'placeholder',
                    'rv-loaded': () => super.template//,
                    //'rv-refresh': () => super.template,
                    //'rv-error': () => super.template
                };

                return stateToTemplate[this.state]();
            }

            get isRefreshing () {
                return this.state === 'rv-loading';
            }

            get name () {                   return this._name; }

            get visibility () {
                return this._activeEntries.some(entry =>
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

                const entries = this._activeEntries;
                const value = entries[0].opacity;

                if (entries.length > 0) {
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
                return this.entries.filter(entry =>
                    entry.blockType === TYPES.SET ||
                    entry.blockType === TYPES.GROUP ||
                    entry.blockType === TYPES.NODE);
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

                return this;
            }

            walk (...args) {
                return this._walk(...args);
            }
        }

        class LegendSet extends LegendEntry {
            // cannot directly contain another legend set
            constructor(...args) {
                super(...args);

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

                return this;
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

            TYPES
        };

        return service;

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
         * @param {Function} decision [optiona = null] if a legendBlock has children (group or set), this function is called to decide whether to walk block's children or not;
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
                        walkResult.concat(entry.walk(action, decision));
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
