(() => {
    'use strict';

    // layer group ids should not collide
    let itemIdCounter = 0;

    // visibility toggle logic goes here
    // TODO: deal with out-of-scale visibility state
    const VISIBILITY_TOGGLE = {
        off: 'on',
        on: 'off'
    };

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

    function legendEntryFactory(gapiService, layerDefaults) {

        const service = {
            singleEntryItem,
            dynamicEntryItem,
            entryGroup,
            dynamicEntryGroup,
            dynamicEntryMasterGroup
        };

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        const ENTRY_ITEM = {
            _layerRef: null,
            type: 'layer',
            name: 'dogguts',
            id: 0,
            options: null,
            flags: null,
            state: 'rv-default', // TODO: replace
            cache: null, // to cache stuff like retrieved metadata info
            symbology: [{
                icon: NO_IMAGE,
                name: ''
            }],

            /**
             * Sets or toggles visibility of the layer legend entry
             * @param {Boolean|undefined} value target visibility value; toggles visibiliyt if not set
             */
            setVisibility(value) {
                const option = this.options.visibility;

                if (typeof value !== 'undefined') {
                    option.value = value ? 'on' : 'off';
                } else {
                    option.value = VISIBILITY_TOGGLE[option.value];
                }
            },

            /**
             * Returns visibility of the layer legend entry
             * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
             */
            getVisibility() {
                return this.options.visibility.value === 'on';
            },

            setOpacity(value) {
                this.options.opacity.value = value;
            },

            init(initialState, layerRef) {
                const defaults = layerDefaults[initialState.layerType];

                this._layerRef = layerRef;
                this.id = 'rv_lt_' + itemIdCounter++;
                this.options = angular.merge({}, defaults.options);
                this.flags = angular.merge({}, defaults.flags);
                this.cache = {};

                angular.merge(this, initialState);

                // this.state = layerStates.default; ??
            }
        };

        const SINGLE_ENTRY_ITEM = Object.create(ENTRY_ITEM);

        SINGLE_ENTRY_ITEM.init = function (initialState, layerRef) {
            ENTRY_ITEM.init.call(this, initialState, layerRef);
            this.setVisibility(this.getVisibility());

            // if there is no metadataurl, remove metadata options altogether
            if (typeof this.metadataUrl === 'undefined') {
                delete this.options.metadata;
            }

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         */
        SINGLE_ENTRY_ITEM.setVisibility = function (value) {
            ENTRY_ITEM.setVisibility.call(this, value);
            this._layerRef.setVisibility(this.getVisibility());
        };

        SINGLE_ENTRY_ITEM.setOpacity = function (value) {
            ENTRY_ITEM.setOpacity.call(this, value);
            this._layerRef.setOpacity(value);
        };

        const DYNAMIC_ENTRY_ITEM = Object.create(ENTRY_ITEM);

        DYNAMIC_ENTRY_ITEM.init = function (initialState, layerRef) {
            ENTRY_ITEM.init.call(this, initialState, layerRef);

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         * @param  {Boolean} isTrigger flag specifying if the actual layer visibility should be set
         */
        DYNAMIC_ENTRY_ITEM.setVisibility = function (value, isTrigger = true) {
            ENTRY_ITEM.setVisibility.call(this, value, false);

            if (isTrigger) {
                this.master._setVisibility();
            }
        };

        DYNAMIC_ENTRY_ITEM.setOpacity = function (value) {
            ENTRY_ITEM.setOpacity.call(this, value, false);
            this.master.setOpacity(value, this._subId);
        };

        const ENTRY_GROUP = {
            type: 'group',
            name: null,
            id: 0,
            expanded: null,
            items: null,
            cache: null, // to cache stuff like retrieved metadata info

            // TODO: add hook to set group options
            options: {
                visibility: {
                    value: 'on', // 'off', 'zoomIn', 'zoomOut'
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
             */
            add(item, position = this.items.length) { // <- awesome! default is re-evaluated everytime the function is called
                item.parent = this;
                this.items.splice(position, 0, item);
            },

            /**
             * Removes a given item (layer or another group) from a layer group.
             * @param {Object} item     layer or group item to add
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
                if (typeof value !== 'undefined') {
                    option.value = value ? 'on' : 'off';
                } else {
                    option.value = VISIBILITY_TOGGLE[option.value];
                }

                if (this.type === 'group') {
                    this.items.forEach(item => item.setVisibility(option.value === 'on', ...arg));
                }
            },

            /**
             * Returns visibility of the group legend entry
             * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
             */
            getVisibility() {
                return this.options.visibility.value === 'on';
            },

            setOpacity(value) {
                this.options.opacity.value = value;
            },

            /**
             * Walks child items executing the provided function on each leaf;
             * Returns a flatten array of results from the provided function;
             * @param  {Function} action function which is passed the following arguments: legend layer entry, its index in its parent's array, parent
             * @return {Array}        flat array of results
             */
            walkItems(action) {
                // roll in the results into a flat array
                return [].concat.apply([], this.items.map((item, index) => {
                    if (item.type === 'group') {
                        return item.walkItems(action);
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

                return this;
            },
        };

        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const DYNAMIC_ENTRY_GROUP = Object.create(ENTRY_GROUP);

        DYNAMIC_ENTRY_GROUP.init = function (initialState, layerRef, expanded) {
            ENTRY_GROUP.init.call(this);

            // get defaults for specific layerType
            const defaults = layerDefaults[initialState.layerType] || {};

            this._layerRef = layerRef;
            this.expanded = expanded;
            this.options = angular.merge({}, defaults.options);
            angular.merge(this, initialState);

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         * @param  {Boolean} isTrigger flag specifying if the actual layer visibility should be set
         */
        DYNAMIC_ENTRY_GROUP.setVisibility = function (value, isTrigger = true) {
            ENTRY_GROUP.setVisibility.call(this, value, false);

            if (isTrigger) {
                this.master._setVisibility();
            }
        };

        DYNAMIC_ENTRY_GROUP.setOpacity = function (value) {
            ENTRY_GROUP.setOpacity.call(this, value);
            this.master.setOpacity(value, this._subId);
        };

        const DYNAMIC_ENTRY_MASTER_GROUP = Object.create(DYNAMIC_ENTRY_GROUP);

        DYNAMIC_ENTRY_MASTER_GROUP.init = function (initialState, layerRef, expanded) {
            DYNAMIC_ENTRY_GROUP.init.call(this, initialState, layerRef, expanded);

            return this;
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         * @param  {Boolean} isTrigger flag specifying if the actual layer visibility should be set
         */
        DYNAMIC_ENTRY_MASTER_GROUP.setVisibility = function (value, isTrigger = true) {
            DYNAMIC_ENTRY_GROUP.setVisibility.call(this, value, false);

            if (isTrigger) {
                this._setVisibility();
            }
        };

        /**
         * Set visibility of the dynamic legend entry based on the visibility of its individual components.
         */
        DYNAMIC_ENTRY_MASTER_GROUP._setVisibility = function () {
            // get an array of visible sublayers (e.g. [1,4,6])
            const visibleSublayerIds =
                this.walkItems(item => {
                    // get sublayer index from the slaves array
                    const index = this.slaves.indexOf(item);
                    return item.getVisibility() ? index : -1;
                })
                .filter(index => index !== -1);

            console.log(this.name + ' set to ' + this.getVisibility() + ' ' + visibleSublayerIds);

            // set visibility of the dynamic layer
            this._layerRef.setVisibility(this.getVisibility());

            // finally, set visibility of the sublayers
            this._layerRef.setVisibleLayers(visibleSublayerIds);
        };

        DYNAMIC_ENTRY_MASTER_GROUP.setOpacity = function (value, subId = -1) {
            if (subId !== -1) {

                const drawingOptions = new gapiService.gapi.layer.LayerDrawingOptions();
                drawingOptions.transparency = (value - 1) * -100;

                const optionsArray = [];
                optionsArray[subId] = drawingOptions;

                this._layerRef.setLayerDrawingOptions(optionsArray);
                this._layerRef.show();

            } else {
                ENTRY_GROUP.setOpacity.call(this, value);
                this._layerRef.setOpacity(value);
            }
        };

        function singleEntryItem(initialState, layerRef) {
            return Object.create(SINGLE_ENTRY_ITEM)
                .init(initialState, layerRef);
        }

        function dynamicEntryItem(initialState, layerRef) {
            return Object.create(DYNAMIC_ENTRY_ITEM)
                .init(initialState, layerRef);
        }

        function entryGroup(name, expanded) {
            return Object.create(ENTRY_GROUP)
                .init(name, expanded);
        }

        function dynamicEntryGroup(initialState, layerRef, expanded) {
            return Object.create(DYNAMIC_ENTRY_GROUP)
                .init(initialState, layerRef, expanded);
        }

        function dynamicEntryMasterGroup(initialState, layerRef, expanded) {
            return Object.create(DYNAMIC_ENTRY_MASTER_GROUP)
                .init(initialState, layerRef, expanded);
        }

        return service;
    }

})();
