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
     * @name factory
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `factory` factory description.
     *
     */
    angular
        .module('app.geo')
        .service('legendEntryFactory', legendEntryFactory);

    function legendEntryFactory(layerDefaults) {

        const service = {
            singleLayerEntry,
            dynamicLayerEntry
        };

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        const LAYER_ENTRY = {
            _layerRef: null,
            type: 'layer',
            name: 'dogguts',
            id: 0,
            options: null,
            flags: null,
            state: 'rv-default', // TODO: replace
            cache: {}, // to cache stuff like retrieved metadata info
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

            init(initialState, layerRef) {
                const defaults = layerDefaults[initialState.layerType];

                this._layerRef = layerRef;
                this.id = 'rv_lt_' + itemIdCounter++;
                this.options = angular.extend({}, defaults.options);
                this.flags = angular.extend({}, defaults.flags);

                angular.merge(this, initialState);

                // if there is no metadataurl, remove metadata options altogether
                if (typeof this.metadataUrl === 'undefined') {
                    delete this.options.metadata;
                }

                // this.state = layerStates.default; ??
            },

            // TODO: reMOVE!
            decorate(name, wrapper) {
                const target = this[name].bind(this);
                this[name] = (...arg) => wrapper.bind(this)(target, ...arg);
            }
        };

        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const SINGLE_LAYER_ENTRY = Object.create(LAYER_ENTRY);
        SINGLE_LAYER_ENTRY.init = function (initialState, layerRef) {
            LAYER_ENTRY.init.call(this, initialState, layerRef);

            this.setVisibility(this.getVisibility());
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         */
        SINGLE_LAYER_ENTRY.setVisibility = function (value) {
            LAYER_ENTRY.setVisibility.call(this, value);
            this._layerRef.setVisibility(this.getVisibility());
        };

        const DYNAMIC_LAYER_ENTRY = Object.create(LAYER_ENTRY);
        DYNAMIC_LAYER_ENTRY.init = function (initialState, layerRef) {
            LAYER_ENTRY.init.call(this, initialState, layerRef);

            // this.setVisibility(this.getVisibility());
        };

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Boolean} value visibility value
         */
        DYNAMIC_LAYER_ENTRY.setVisibility = function (value, notifyMaster = true) {
            LAYER_ENTRY.setVisibility.call(this, value);

            // more stuff
        };

        function singleLayerEntry(initialState, layerRef) {
            const featureLayerEntry = Object.create(SINGLE_LAYER_ENTRY);
            featureLayerEntry.init(initialState, layerRef);

            return featureLayerEntry;
        }

        function dynamicLayerEntry(initialState, layerRef) {
            const dynamicLayerEntry = Object.create(DYNAMIC_LAYER_ENTRY);
            dynamicLayerEntry.init(initialState, layerRef);

            return dynamicLayerEntry;
        }

        return service;
    }

})();
