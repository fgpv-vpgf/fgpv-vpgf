(() => {
    'use strict';

    // layer group ids should not collide
    let itemIdCounter = 0;

    // TODO: move this somewhere later
    // jscs:disable maximumLineLength
    const NO_IMAGE =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUJJREFUeNrs172Kg0AQB/BcOLHSRhBFEF/B5/cBrMRGsLESFBFsFAs/ivuTheW4kOBN1mSLmWJB0PGHM6vjV5IkF/3ietEymMUsZjGLWcxiltas7+OnNk3T9/22bYTbGIbhum4QBIpZMJVl+coDGIYB60HZUVZd11ht27Ysi2CapmkcRyRRzFqWBWsYhp7nEVhd1xVFIZLwTnwQaMd1XfVi5XmOjZJlGUF2Pc8ktt48z23basGSpg/0FkqTpinKpNxEZ8GEpkGB0NS/ZUpMRJY0iUN8kdSaKKw/Jsdx4jhWa6KwsK3ONr3U8ueZ6KxTTf+btyQIw5MYBDAXuLd4fgnmDll3xSzTNPd9l5PJ/evqSWCkEecjiWKW7/tVVY23IJcGSRSzoihC7bQbmsW8ezwv/5Axi1nMYhazmMWst8ePAAMA0CzGRisOjIgAAAAASUVORK5CYII=';
    // jscs:enable maximumLineLength

    /**
     * @ngdoc service
     * @name legendEntryFactory
     * @module app.geo
     * @requires layerDefaults
     * @description
     *
     * The `legendEntryFactory` factory creates legend entries to be added to the toc.
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
                obj._layerRecord.addStateListener(state => {
                    const handlers = {
                        [Geo.Layer.States.ERROR]: () => {
                            obj.setLayerState(Geo.Layer.States.ERROR, 100);
                            obj.setLayerLoadingFlag(false, 100);
                        },
                        [Geo.Layer.States.REFRESH]: () => obj.setLayerLoadingFlag(true, 300),
                        [Geo.Layer.States.LOADED]: () => obj.setLayerLoadingFlag(false, 100),
                    };

                    if (handlers.hasOwnProperty(state)) {
                        handlers[state]();
                    }
                });
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

                if (obj.flags) {

                    // currently, non-feature based things have text-ish content put in their featureIdx.  map them to 0
                    const adjIdx = isNaN(obj.featureIdx) ? '0' : obj.featureIdx;

                    // TODO remove this test once it has passed the test of time
                    if (typeof scaleSet[adjIdx] === 'undefined') {
                        console.warn('setLayerScaleFlag - indexes are not lining up');
                    }
                    obj.flags.scale.visible = scaleSet[adjIdx];

                } else if (obj.layerEntries) {
                    // walk through layerEntries and update each one
                    obj.layerEntries.forEach(ent => {
                        const slave = obj.slaves[ent.index];

                        if (slave.flags) {
                            // TODO remove this test once it has passed the test of time
                            if (typeof scaleSet[slave.featureIdx] === 'undefined') {
                                console.warn('setLayerScaleFlag - indexes are not lining up -- slave case');
                            }
                            slave.flags.scale.visible = scaleSet[slave.featureIdx];
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
            name: 'dogguts',
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
                }
            });

            this.bindListeners();

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
            },
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
