(() => {
    'use strict';

    // layer group ids should not collide
    let itemIdCounter = 0;

    // TODO: move this somewhere later
    // jscs:disable maximumLineLength
    const NO_IMAGE =
        'data:image/png;base64,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';
    // jscs:enable maximumLineLength

    /**
     * @module legendEntryFactory
     * @memberof app.geo
     * @requires layerDefaults
     * @description
     *
     * The `legendEntryFactory` factory creates legend entries to be added to the toc.
     * TODO this module is due for refactoring, it's docs should be updated at that time
     *
     */
    angular
        .module('app.geo')
        .service('legendEntryFactory', legendEntryFactory);

    function legendEntryFactory($timeout, $translate, gapiService, Geo, layerDefaults) {

        const service = {
            placeholderEntryItem,
            singleEntryItem,
            dynamicEntryItem,
            entryGroup,
            dynamicEntryGroup,
            dynamicEntryMasterGroup
        };

        /**
         * Adds event bindings.  To be used with ENTRY_ITEM and ENTRY_GROUP
         * types.
         * @param {Object} obj the object to augment with event bindings
         */
        function eventsMixin(obj) {
            /**
             * Adds listeners for ERROR, REFRESH and LOADED states.  Sets
             * the appropriate flags on the LegendEntry object it is bound to.
             */
            obj.bindListeners = () => {

                const listener = state => {
                    const handlers = {
                        [Geo.Layer.States.ERROR]: () => {
                            obj.setLayerState(Geo.Layer.States.ERROR, 100);
                            obj.setLayerLoadingFlag(false, 100);
                        },
                        [Geo.Layer.States.REFRESH]: () => obj.setLayerLoadingFlag(true, 300),
                        [Geo.Layer.States.LOADED]: () => obj.setLayerLoadingFlag(false, 100)
                    };

                    if (handlers.hasOwnProperty(state)) {
                        handlers[state]();
                    }
                };
                obj._layerRecord.addStateListener(listener);
                obj.unbindListeners = () => obj._layerRecord.removeStateListener(listener);
            };

            /**
             * Sets state of the layer entry: error, default, out-of-scale, etc
             * @param {String} state defaults to `default`; state name
             * @param {Number} delay defaults to 0; delay before setting the state
             */
            obj.setLayerState = (state = Geo.Layer.States.DEFAULT, delay = 0) => {
                // same as with map loading indicator, need timeout since it's a non-Angular async call
                $timeout.cancel(obj._stateTimeout);
                obj._stateTimeout = $timeout(() => obj.state = state, delay);
            };

            /**
             * Sets `isLoading` flag on the legend entry.
             * @param {Boolean} isLoading defaults to true; flag indicating if the layer is updating their content
             * @param {Number} delay defaults to 0; delay before setting the state
             */
            obj.setLayerLoadingFlag = (isLoading = true, delay = 0) => {
                // same as with map loading indicator, need timeout since it's a non-Angular async call
                $timeout.cancel(obj._loadingTimeout);
                obj._loadingTimeout = $timeout(() => obj.isLoading = isLoading, delay);
            };

            /**
             * Sets `scale` flags on the legend entry.
             * @param {Boolean} scaleSet     mapping of featureIdx to booleans reflecting flag state
             */
            obj.setLayerScaleFlag = (scaleSet) => {

                if (obj.layerType !== Geo.Layer.Types.ESRI_DYNAMIC) {
                    // currently, non-feature based things have text-ish content put in their featureIdx.  map them to 0
                    const adjIdx = isNaN(obj.featureIdx) ? '0' : obj.featureIdx;

                    // TODO remove this test once it has passed the test of time
                    // quite often, it is undefined for example Eco Geo always start at 1. We need to keep this or modify upfront
                    if (typeof scaleSet[adjIdx] === 'undefined') {
                        console.warn('setLayerScaleFlag - indexes are not lining up');
                    } else {
                        // set scale flag properties and offscale options (only for legend entry, only on featureLayer and dynamicLayer for now)
                        const scale = scaleSet[adjIdx];
                        obj.flags.scale.visible = scale.value;
                        if (obj.options.offscale) {
                            obj.options.offscale.value = scale.zoomIn;
                        }
                    }
                } else {
                    // walk through layerEntries and update each one
                    obj.layerEntries.forEach(ent => {
                        if (obj.slaves) {
                            const slave = obj.slaves[ent.index];

                            if (slave.flags) {
                                // TODO remove this test once it has passed the test of time
                                if (typeof scaleSet[slave.featureIdx].value === 'undefined') {
                                    console.warn('setLayerScaleFlag - indexes are not lining up -- slave case');
                                }
                                slave.flags.scale.visible = scaleSet[slave.featureIdx].value;
                                slave.options.offscale.value = scaleSet[slave.featureIdx].zoomIn;
                            }
                        }
                    });
                }
            };
        }

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        const ENTRY_ITEM = {
            _layerRecord: null,
            type: 'layer',
            name: null,
            id: 0,
            options: null,
            flags: null,
            state: 'rv-default', // TODO: replace
            cache: null, // to cache stuff like retrieved metadata info
            features: null,
            sortGroup: -1,
            symbology: [{
                icon: NO_IMAGE,
                name: ''
            }],

            /**
             * Sets or toggles visibility of the layer legend entry
             * @param {Boolean|undefined} value target visibility value; toggles visibility if not set
             */
            setVisibility(value) {
                const option = this.options.visibility;
                option.value = typeof value !== 'undefined' ? value : !option.value;
            },

            /**
             * Returns visibility of the layer legend entry
             * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
             */
            getVisibility() {
                return this.options.visibility.value;
            },

            setOpacity(value) {
                this.options.opacity.value = value;
            },

            getOpacity() {
                return this.options.opacity.value;
            },

            setCache(name, value) {
                this.cache[name] = value;
            },

            getCache(name) {
                return this.cache[name];
            },

            init(initialState, layerRec) {
                const defaults = layerDefaults[initialState.layerType];

                this._layerRecord = layerRec;
                this.id = 'rv_lt_' + itemIdCounter++;
                this.options = angular.merge({}, defaults.options);
                this.flags = angular.merge({}, defaults.flags);
                this.cache = {};
                this.features = {
                    count: '...counting'
                };

                // find appropriate sort group based on the initial layer type
                this.sortGroup = Geo.Layer.SORT_GROUPS.findIndex(sortGroup =>
                    sortGroup.indexOf(initialState.layerType) !== -1);

                // sets default geometry type which is 'feature'
                // to avoid pulling in angular translate interpolation message format plugin for now,
                // store both plural and singular strings as the same transltion separated by a |
                $translate(Geo.Layer.Esri.GEOMETRY_TYPES.generic).then(type =>
                    this.features.type = type.split('|')[1]);

                angular.merge(this, initialState);

                // this.state = layerStates.default; ??

                // check to see if we need settings
                checkSettings(this.options);
                eventsMixin(this);
            }
        };

        const PLACEHOLDER_ENTRY_ITEM = Object.create(ENTRY_ITEM);

        PLACEHOLDER_ENTRY_ITEM.init = function(initialState, layerRec) {
            ENTRY_ITEM.init.call(this, initialState, layerRec);

            // TODO: suggestion: separate legend entry ids from layer object ids
            this.id += 'placeholder';
            this.type = 'placeholder';
            this.state = 'rv-loading';

            // let placeholders have reload and/or remove buttons when needed (error gets both, loading gets remove only)
            // FIXME: shouldn't be inline here (harder to maintain), move this to somewhere more appropriate
            angular.merge(this.options, {
                reload: {
                    enabled: true
                },
                remove: {
                    enabled: true
                },
                reorder: {
                    enabled: true
                }
            });

            this.bindListeners();

            // since the main purpose of these placeholders is to indicate that layers are loading (or failed to load),
            // we set `isLoading` flag to `true` right away
            this.setLayerLoadingFlag(true);

            return this;
        };

        const SINGLE_ENTRY_ITEM = Object.create(ENTRY_ITEM);

        SINGLE_ENTRY_ITEM.init = function (initialState, layerRec) {
            ENTRY_ITEM.init.call(this, initialState, layerRec);
            this.setVisibility(this.getVisibility());
            this.setOpacity(this.options.opacity.value);

            // if there is no metadataurl, remove metadata options altogether
            if (typeof this.metadataUrl === 'undefined') {
                delete this.options.metadata;
            }

            // FIXME: this should be done only on feature layers, nothing else!
            // HACK: to get file based layers working; this will be solved by the layer record and legend entry hierarchy
            if (typeof initialState.url !== 'undefined') {
                const urlParts = initialState.url.split('/');
                this.featureIdx = urlParts.pop(); // get the featureidx from the end of the url
                this.url = urlParts.join('/'); // keep the rest of the url (without the index)
            } else {
                // TODO: this should be done is a more civilized way
                this.featureIdx = '0'; // for a file based layer, feature index should always be 0
            }
            this.bindListeners();

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         */
        SINGLE_ENTRY_ITEM.setVisibility = function (value) {
            ENTRY_ITEM.setVisibility.call(this, value);
            this._layerRecord.setVisibility(this.getVisibility());
        };

        /**
         * Sets opacity of a simple layero bject, one which is represented by a single entry in the legend
         * @param {Number} value opacity value 0 to 1 where 0 is fully transparent
         */
        SINGLE_ENTRY_ITEM.setOpacity = function (value) {
            ENTRY_ITEM.setOpacity.call(this, value);
            this._layerRecord.setOpacity(value);
        };

        const DYNAMIC_ENTRY_ITEM = Object.create(ENTRY_ITEM);

        DYNAMIC_ENTRY_ITEM.init = function (initialState, layerRec) {
            ENTRY_ITEM.init.call(this, initialState, layerRec);

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         * @param  {Boolean} isTrigger flag specifying if the visibility value should be applied to the actual layer; this is used to avoid setting visiblity multiple times for items in a subgroup when propagating
         */
        DYNAMIC_ENTRY_ITEM.setVisibility = function (value, isTrigger = true) {
            ENTRY_ITEM.setVisibility.call(this, value, false);

            if (isTrigger) {
                this.master._setVisibility();
            }
        };

        /**
         * Sets opacity value of the dynamic sublayer.
         * This makes the sublayer and all its children transparent relative to other subgroups/layers, not relative to other layers on the map.
         * @param {Number} value opacity value 0 to 100 where 100 is fully transparent
         */
        DYNAMIC_ENTRY_ITEM.setOpacity = function (value) {
            ENTRY_ITEM.setOpacity.call(this, value, false);
            this.master._setOpacity([this.featureIdx]);
        };

        const ENTRY_GROUP = {
            type: 'group',
            name: null,
            id: 0,
            expanded: null,
            items: null,
            cache: null, // to cache stuff like retrieved metadata info
            sortGroup: -1,

            // TODO: add hook to set group options
            options: {
                visibility: {
                    value: true,
                    enabled: true
                },
                remove: {
                    enabled: false
                }
            },

            /**
             * Adds an item (layer or another group) to a layer group.
             * @param {Object} item     layer or group item to add
             * @param {Number} position position to insert the item at; defaults to the last position in the array
             * @return position of the inserted item
             */
            add(item, position = this.items.length) { // <- awesome! default is re-evaluated everytime the function is called
                item.parent = this;
                this.items.splice(position, 0, item);

                return position;
            },

            /**
             * Removes a given item (layer or another group) from a layer group.
             * @param {Object} item     layer or group item to remove
             * @return {Number}      index of the item before removal or -1 if the item is not in the group
             */
            remove(item) {
                const index = this.items.indexOf(item);
                if (index !== -1) {
                    delete item.parent;
                    this.items.splice(index, 1);
                }

                return index;
            },

            /**
             * Sets or toggles visibility of the group legend entry and all it's children
             * @param {Boolean|undefined} value target visibility value; toggles visibility if not set
             * Other arguments are passed straight to child functions; useful for decorators;
             */
            setVisibility(value, ...arg) {
                const option = this.options.visibility;
                option.value = typeof value !== 'undefined' ? value : !option.value;

                // set visibility to the rest of the group
                if (this.type === 'group') {
                    this.items.forEach(item => item.setVisibility(option.value, ...arg));
                }
            },

            /**
             * Returns visibility of the group legend entry
             * @return {Boolean} true - visible; false - not visible; undefined - visible and invisible at the same time (AKA blink)
             */
            getVisibility() {
                return this.options.visibility.value;
            },

            setOpacity(value) {
                this.options.opacity.value = value;
            },

            getOpacity() {
                return this.options.opacity.value;
            },

            /**
             * Finds and returns a legend entry object with the specified id.
             * @param  {Number} entryId
             * @return {Object}    legend entry object or undefined if nothing is found
             */
            getItemById(entryId) {
                return this.walkItems(item =>
                    item.id === entryId ? item : [],
                    true
                )[0]; // true is important here as we want to test entry groups as well
            },

            /**
             * Walks child items executing the provided function on each leaf;
             * Returns a flatten array of results from the provided function;
             * @param  {Function} action function which is passed the following arguments: legend layer entry, its index in its parent's array, parent
             * @param  {Boolean} defaults to false; includeGroups flag specifying if the action should be applied to group items as well.
             * @return {Array}        flat array of results
             */
            walkItems(action, includeGroups = false) {
                // roll in the results into a flat array
                return [].concat.apply([], this.items.map((item, index) => {
                    if (item.type === 'group') {
                        if (includeGroups) {
                            return [].concat(action(item, index, this), item.walkItems(action, true));
                        } else {
                            return item.walkItems(action);
                        }
                    } else {
                        return action(item, index, this);
                    }
                }));
            },

            init(name, expanded = false) {
                this.id = 'rv_lt_' + itemIdCounter++;
                this.name = name;
                this.expanded = expanded;
                this.items = [];
                this.cache = {};
                eventsMixin(this);

                return this;
            }
        };

        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const DYNAMIC_ENTRY_GROUP = Object.create(ENTRY_GROUP);

        DYNAMIC_ENTRY_GROUP.init = function (initialState, layerRec, expanded) {
            ENTRY_GROUP.init.call(this);

            // get defaults for specific layerType
            const defaults = layerDefaults[initialState.layerType] || {};

            this._layerRecord = layerRec;
            this.expanded = expanded;
            this.options = angular.merge({}, defaults.options);
            angular.merge(this, initialState);

            // check to see if we need settings
            checkSettings(this.options);

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         * @param  {Boolean} isTrigger flag specifying if the visibility value should be applied to the actual layer; this is used to avoid setting visiblity multiple times for items in a subgroup when propagating
         */
        DYNAMIC_ENTRY_GROUP.setVisibility = function (value, isTrigger = true) {
            ENTRY_GROUP.setVisibility.call(this, value, false);

            if (isTrigger) {
                this.master._setVisibility();
            }
        };

        /**
         * Sets opacity value of the dynamic subgroup.
         * This makes the subgroup and all its children transparent relative to other subgroups/layers, not relative to other layers on the map.
         * @param {Number} value opacity value 0 to 100 where 100 is fully transparent
         */
        DYNAMIC_ENTRY_GROUP.setOpacity = function (value) {
            ENTRY_GROUP.setOpacity.call(this, value);
            this.master._setOpacity([this.featureIdx]);
        };

        const DYNAMIC_ENTRY_MASTER_GROUP = Object.create(DYNAMIC_ENTRY_GROUP);

        DYNAMIC_ENTRY_MASTER_GROUP.init = function (initialState, layerRec, expanded) {
            DYNAMIC_ENTRY_GROUP.init.call(this, initialState, layerRec, expanded);
            console.info('Binding master group listener');
            console.info(this);
            this.bindListeners();

            // morph layerEntries array into an object where keys are indexes of sublayers:
            // { 1: {index: 1, ...}, 4: { index: 4, ...} }
            const layerEntriesOptions = {};
            this.layerEntries.forEach(layerEntry => {
                layerEntriesOptions[layerEntry.index] = layerEntry;
            });

            // find appropriate sort group based on the initial layer type
            this.sortGroup = Geo.Layer.SORT_GROUPS.findIndex(sortGroup =>
                sortGroup.indexOf(initialState.layerType) !== -1);

            const layerEntryType = `${initialState.layerType}LayerEntry`;
            this.slaves = [];

            // generate all the slave sublayers upfornt ...
            console.log(this._layerRecord);
            console.log(initialState);
            this._layerRecord.layerInfos.forEach((layerInfo, index) => {
                let sublayerEntry;
                const sublayerEntryInitialState = {
                    name: layerInfo.name,
                    layerType: layerEntryType,
                    options: layerEntriesOptions[index] || {},
                    featureIdx: index
                };

                if (layerInfo.subLayerIds) { // group item
                    sublayerEntry = service.dynamicEntryGroup(sublayerEntryInitialState);
                } else { // leaf item
                    sublayerEntry = service.dynamicEntryItem(sublayerEntryInitialState);
                }

                assignDirectMaster.call(this, sublayerEntry, layerInfo.parentLayerId);
            });

            // if there is no metadataurl, remove metadata options altogether
            if (typeof this.metadataUrl === 'undefined') {
                delete this.options.metadata;
                this.slaves.forEach(slave => delete slave.options.metadata);
            }

            // if the 'supportsDynamicLayers' flag is false, remove sublayer opacity options
            if (!this._layerRecord.supportsDynamicLayers) {
                // FIXME: we do not use parens for arrow functions even when multilines (styleguide 8.4). Something to look at once we release the beta.
                this.slaves.forEach(slave => {
                    delete slave.options.opacity;

                    // check to see if we still need settings because we removed opacity
                    checkSettings(slave.options);
                });
            }

            if (this.layerEntries) {
                // add to the legend only once that are specified
                // NOTE:  :point_up: [March 18, 2016 12:53 PM](https://gitter.im/RAMP-PCAR/TeamRoom?at=56ec3281bb4a1731739b0d33)
                // We assume the inclusion is properly formatted (ex: [1, 2] will result in sublayer 2 being included twice - once under root and once more time under 1).
                this.layerEntries.forEach(({ index }) => {
                    const slave = this.slaves[index];
                    // if layerEntry id is incorrect, ignore it
                    if (slave) {
                        slave.setVisibility(slave.getVisibility(), false); // set visibility on the item which will propagate down if it has any items of its own
                        this.add(slave); // add layer entry to the master group
                    }
                });
            } else {
                // add all tile sublayers to the toc entry
                this.slaves.forEach(slave => this.add(slave));
            }

            // set initial visibility of the sublayers;
            // this cannot be set in `layerRegistry` because legend entry for dynamic layer didn't exist yet;
            this._setVisibility(); // apply initial visibility values
            this._setOpacity(); // apply initial opacity values

            return this;

            /**
             * Finds direct parent of a child item in dynamic layer group and adds it to its items array.
             * `this` refers to the master group entry;
             * @param  {Object} item     layer or group item
             * @param  {Number} masterId id of the direct parent
             */
            function assignDirectMaster(item, masterId) {
                /*jshint validthis:true */
                item.master = this; // store a reference to the root group item of the dynamic layer
                this.slaves.push(item); // store in slave reference array

                if (masterId !== -1) {
                    this.slaves[masterId].add(item); // add to master's items list only if it's not the root
                }
            }
        };

        /**
         * Sets visibility of a dynamic entry root object.
         * @param  {Boolean} value visibility value
         * @param  {Boolean} isTrigger flag specifying if the visibility value should be applied to the actual layer; this is used to avoid setting visiblity multiple times for items in a subgroup when propagating
         */
        DYNAMIC_ENTRY_MASTER_GROUP.setVisibility = function (value, isTrigger = true) {
            DYNAMIC_ENTRY_GROUP.setVisibility.call(this, value, false);

            if (isTrigger) {
                this._setVisibility();
            }
        };

        /**
         * Sets opacity value of the dynamic layer itself, not individual sublayers
         * This actually makes the layer transparent, allowing to basemap and other layer to show through
         * @param {Number} value opacity value 0 to 1 where 0 is fully transparent
         */
        DYNAMIC_ENTRY_MASTER_GROUP.setOpacity = function (value) {
            ENTRY_GROUP.setOpacity.call(this, value);
            this._setOpacity();
        };

        /**
         * Applies current visibility values of the sublayers of a dynamic layer.
         */
        DYNAMIC_ENTRY_MASTER_GROUP._setVisibility = function () {
            // get an array of visible sublayers (e.g. [1,4,6])
            const visibleSublayerIds =
                this.walkItems(item => {
                    // get sublayer index from the slaves array
                    const index = this.slaves.indexOf(item);
                    return item.getVisibility() ? index : -1;
                })
                .filter(index => index !== -1); // filter out ones that are not visible

            // console.log(this.name + ' set to ' + this.getVisibility() + ' ' + visibleSublayerIds);
            this.options.visibility.value = visibleSublayerIds.length > 0;

            // apply visibility to the dynamic layer itself
            this._layerRecord.setVisibility(this.getVisibility());

            // finally, apply visibility values to the sublayers
            this._layerRecord.setVisibleLayers(visibleSublayerIds);
        };

        /**
         * Applies current opacity values to the specified sublayers of a dynamic layer.
         * @param {Array} subIds array of sublayer to apply the current opacity value to; if none specified, apply current opacity value to the layer itself and all its children
         */
        DYNAMIC_ENTRY_MASTER_GROUP._setOpacity = function (subIds) {
            if (typeof subIds === 'undefined') {
                subIds = this.walkItems(item => this.slaves.indexOf(item));

                // apply opacity to the whole layer
                this._layerRecord.setOpacity(this.options.opacity.value);
            }

            // well, if it's not supported, we can't set opacity for sublayers, bummer
            if (this._layerRecord.supportsDynamicLayers) {
                const optionsArray = [];

                // create an array of drawing options
                subIds.forEach(subId => {
                    const opacityValue = this.slaves[subId].options.opacity.value;
                    const drawingOptions = new gapiService.gapi.layer.LayerDrawingOptions();
                    drawingOptions.transparency = (opacityValue - 1) * -100; // instead of being consistent, esri using value from 0 to 100 for sublayer transparency where 100 is fully transparent

                    optionsArray[subId] = drawingOptions;
                });

                this._layerRecord.setLayerDrawingOptions(optionsArray);
                // this._layerRecord.show(); // ? is this necessary
            }
        };

        /**
        * Check if we need to remove the settings value from options
        * @private
        * @param {Object} options layer options
        */
        function checkSettings(options) {
            // if opacity, bounding box, snapshot and query are not present, remove settings
            if (typeof options.opacity === 'undefined' &&
                typeof options.boundingBox === 'undefined' &&
                typeof options.snapshot === 'undefined' &&
                typeof options.query === 'undefined') {
                delete options.settings;
            }
        }

        function placeholderEntryItem(initialState, layerRec) {
            return Object.create(PLACEHOLDER_ENTRY_ITEM)
                .init(initialState, layerRec);
        }

        function singleEntryItem(initialState, layerRec) {
            return Object.create(SINGLE_ENTRY_ITEM)
                .init(initialState, layerRec);
        }

        function dynamicEntryItem(initialState, layerRec) {
            return Object.create(DYNAMIC_ENTRY_ITEM)
                .init(initialState, layerRec);
        }

        function entryGroup(name, expanded) {
            return Object.create(ENTRY_GROUP)
                .init(name, expanded);
        }

        function dynamicEntryGroup(initialState, layerRec, expanded) {
            return Object.create(DYNAMIC_ENTRY_GROUP)
                .init(initialState, layerRec, expanded);
        }

        function dynamicEntryMasterGroup(initialState, layerRec, expanded) {
            return Object.create(DYNAMIC_ENTRY_MASTER_GROUP)
                .init(initialState, layerRec, expanded);
        }

        return service;
    }

})();
