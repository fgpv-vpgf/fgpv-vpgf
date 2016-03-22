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

    // TODO: ignore this for now;
    const GROUP_TYPES = {
        regular: 'regular', // this group can be deleted but has no extra controls
        immutable: 'immutable', // this group has no extra controls and cannot be deleted
        esriFeature: 'esriFeature',
        esriDynamic: 'esriDynamic', // this group can be deleted and has extra controls such as setting (opacity, query), metadata,
        esriTile: 'esriTile' // this group can be deleted and has extra controls such as settings (opacity)
    };

    // jscs doesn't like enhanced object notation
    // jscs:disable requireSpacesInAnonymousFunctionExpression
    // groupType: 'regular', 'dynamic'
    const LAYER_GROUP = (name, groupType = GROUP_TYPES.regular, expanded = false) => {
        return {
            type: 'group',
            groupType,
            name,
            id: 'rv_lg_' + itemIdCounter++,
            expanded,
            items: [],

            // TODO: add hook to set group options
            options: {
                visibility: {
                    value: 'on', // 'off', 'zoomIn', 'zoomOut'
                    enabled: true
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
                option.value = value || VISIBILITY_TOGGLE[option.value];

                if (this.type === 'group') {
                    this.items.forEach(item => item.setVisibility(option.value, ...arg));
                }
            },

            /**
             * Returns visiblity of the group legend entry
             * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
             */
            getVisibility() {
                return this.options.visibility.value === 'on';
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

            /**
             * Wraps a default function of the group legend entry
             * @param  {String} name    Name of the local function to wrap
             * @param  {Function} wrapper a wrapper function; it recieves the original funciton as the first argument; it's context is set to this
             */
            decorate(name, wrapper) {
                const target = this[name].bind(this);
                this[name] = (...arg) => wrapper.bind(this)(target, ...arg);
            }
        };
    };

    // layer item generator
    const LAYER_ITEM = (name, layerType, options, flags) => {
        return {
            type: 'layer',
            name,
            id: 'rv_lt_' + itemIdCounter++,
            layerType,
            options,
            flags,

            /**
             * Sets or toggles visibility of the layer legend entry
             * @param {Boolean|undefined} value target visibility value; toggles visibiliyt if not set
             */
            setVisibility(value) {
                const option = this.options.visibility;
                option.value = value || VISIBILITY_TOGGLE[option.value];
            },

            /**
             * Returns visiblity of the layer legend entry
             * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
             */
            getVisibility() {
                return this.options.visibility.value === 'on';
            },

            /**
             * Wraps a default function of the layer legend entry
             * @param  {String} name    Name of the local function to wrap
             * @param  {Function} wrapper a wrapper function; it recieves the original funciton as the first argument; it's context is set to this
             */
            decorate(name, wrapper) {
                const target = this[name].bind(this);
                this[name] = (...arg) => wrapper.bind(this)(target, ...arg);
            }
        };
    };
    // jscs:enable requireSpacesInAnonymousFunctionExpression

    // TODO: move this somewhere later
    // jscs:disable maximumLineLength
    const NO_IMAGE =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUJJREFUeNrs172Kg0AQB/BcOLHSRhBFEF/B5/cBrMRGsLESFBFsFAs/ivuTheW4kOBN1mSLmWJB0PGHM6vjV5IkF/3ietEymMUsZjGLWcxiltas7+OnNk3T9/22bYTbGIbhum4QBIpZMJVl+coDGIYB60HZUVZd11ht27Ysi2CapmkcRyRRzFqWBWsYhp7nEVhd1xVFIZLwTnwQaMd1XfVi5XmOjZJlGUF2Pc8ktt48z23basGSpg/0FkqTpinKpNxEZ8GEpkGB0NS/ZUpMRJY0iUN8kdSaKKw/Jsdx4jhWa6KwsK3ONr3U8ueZ6KxTTf+btyQIw5MYBDAXuLd4fgnmDll3xSzTNPd9l5PJ/evqSWCkEecjiWKW7/tVVY23IJcGSRSzoihC7bQbmsW8ezwv/5Axi1nMYhazmMWst8ePAAMA0CzGRisOjIgAAAAASUVORK5CYII=';
    // jscs:enable maximumLineLength

    /**
     * @ngdoc service
     * @name legendService
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `legendService` factory constructs the legend (auto or structured). `LayerRegistry` instantiates `LegendService` providing the current config, layers and legend containers.
     * This service also scrapes layer symbology.
     *
     */
    angular
        .module('app.geo')
        .factory('legendService', legendServiceFactory);

    function legendServiceFactory($http, $q, layerDefaults, layerTypes) {
        const legendSwitch = {
            structured: structuredLegendService,
            autopopulate: autoLegendService
        };

        return (config, ...args) => legendSwitch[config.legend.type](config, ...args);

        /**
         * Constrcuts and maintains autogenerated legend.
         * @param  {Object} config current config
         * @param  {Object} layers object with layers from `layerRegistry`
         * @param  {Array} legend array for legend item from `layerRegistry`
         * @return {Object}        instance of `legendService` for autogenerated legend
         */
        function autoLegendService(config, layers, legend) {
            const ref = {
                dataGroup: LAYER_GROUP('Data layers', GROUP_TYPES.immutable, true),
                imageGroup: LAYER_GROUP('Image layers', GROUP_TYPES.immutable, true),
                root: legend.items
            };

            // maps layerTypes to default layergroups
            const layerTypeGroups = {
                esriDynamic: ref.dataGroup,
                esriFeature: ref.dataGroup,
                esriImage: ref.imageGroup,
                esriTile: ref.imageGroup,
                ogcWms: ref.imageGroup
            };

            // maps layerTypes to layer item generators
            const layerTypeGenerators = {
                esriDynamic: dynamicGenerator,
                esriFeature: featureGenerator,
                esriImage: imageGenerator,
                esriTile: tileGenerator,
                ogcWms: imageGenerator
            };

            const service = {
                addLayer,
                removeLayer
            };

            init();

            return service;

            /***/

            /**
             * Initializes autolegend by adding data and image groups to it.
             */
            function init() {
                ref.root.push(ref.dataGroup, ref.imageGroup);
            }

            /**
             * Creates a grouped layer toc entry (for dynamic and tile layers)
             * @param  {Object} layer layer object from the `layerRegistry`
             * @return {Object}       toc layer entry with hierarchy of sublayers and added symbology
             * @private
             */
            function createGroupedLayerEntry(layer) {
                const symbologyPromise = getMapServerSymbology(layer);
                const dynamicGroup = LAYER_GROUP(layer.state.name, layer.state.layerType);
                dynamicGroup.slaves = [];
                dynamicGroup.options.visibility.value = layer.state.options.visibility.value;

                // generate all the slave sublayers upfornt ...
                layer.layer.layerInfos.forEach(layerInfo => {
                    if (layerInfo.subLayerIds) { // group item
                        const groupItem = LAYER_GROUP(layerInfo.name, layer.state.layerType);

                        assignDirectMaster(groupItem, layerInfo.parentLayerId);
                    } else { // leaf item
                        const layerItem = LAYER_ITEM(layerInfo.name, layer.state.layerType);

                        // TODO: need generate options and flags presets for group layer children
                        angular.merge(layerItem, {
                                cache: {} // to cache stuff like retrieved metadata info
                            },

                            // TODO: temp
                            layerDefaults[layerTypes[layer.state.layerType]]
                        );

                        assignDirectMaster(layerItem, layerInfo.parentLayerId);
                    }
                });

                // wait for symbology to load and ...
                symbologyPromise
                    .then(({ data }) => { // ... and apply them to existing child items
                        data.layers.forEach(layer => applySymbology(dynamicGroup.slaves[layer.layerId], layer));

                        // add some default image if there missing symbology
                        dynamicGroup.slaves.forEach(slave => {
                            if (slave.symbology) {
                                return;
                            }

                            slave.symbology = [{
                                icon: NO_IMAGE,
                                name: slave.name
                            }];
                        });
                    });

                return dynamicGroup;

                /**
                 * Finds direct parent of a child item in dynamic layer group and adds it to its items array.
                 * @param  {Object} item     layer or group item
                 * @param  {Number} masterId id of the direct parent
                 */
                function assignDirectMaster(item, masterId) {
                    item.master = dynamicGroup; // store a reference to the root group item of the dynamic layer
                    dynamicGroup.slaves.push(item); // store in slave reference array

                    if (masterId !== -1) {
                        dynamicGroup.slaves[masterId].add(item); // add to master's items list only if it's not the root
                    }
                }
            }

            /**
             * Parses a dynamic layer object and creates a legend item (with nested groups and symbology)
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function dynamicGenerator(layer) {
                const tocEntry = createGroupedLayerEntry(layer);

                tocEntry.decorate('setVisibility', applyDynamicRootVisibility);
                tocEntry.decorate('getVisibility', getDynamicRootVisibility);

                // decorate all leaves
                tocEntry.slaves.forEach(slave => {
                    if (slave.type === 'layer') {
                        slave.decorate('setVisibility', applyDynamicLeafVisibility);
                    }
                });

                // add to the legend only once that are specified
                // NOTE:  :point_up: [March 18, 2016 12:53 PM](https://gitter.im/RAMP-PCAR/TeamRoom?at=56ec3281bb4a1731739b0d33)
                // We assume the inclusion is properly formatted (ex: [1, 2] will result in sublayer 2 being included twice - once under root and once more time under 1).
                layer.state.layerEntries.forEach(({ index }) => {
                    // if layerEntry id is incorrect, ignore it
                    if (index > tocEntry.slaves.length - 1) {
                        return;
                    }
                    const slave = tocEntry.slaves[index];

                    // TODO: for now assume all layer entries should be visible; need to change this later
                    slave.options.visibility.value = 'on';

                    tocEntry.add(slave);
                });

                layer.layer.setVisibility(true); // make the layer itself visible

                // set initial visiblity of the sublayers
                // TODO: might want to rethink this a bit; want to get it working right now
                if (tocEntry.options.visibility.value === 'on') {
                    tocEntry.setVisibility(null, true);
                } else {
                    tocEntry.setVisibility('off');
                }

                return tocEntry;

                /**
                 * Returns visibility array for the dynamic layer
                 * @return {Array} an array of visible sublayers (e.g. [1,4,6])
                 */
                function getDynamicRootVisibility() {
                    return tocEntry.walkItems(item => {
                        // get sublayer index from the slaves array
                        const index = tocEntry.slaves.indexOf(item);
                        return item.getVisibility() ? index : -1;
                    }).filter(index => index !== -1);
                }

                /**
                 * Set visiblity of the root group in the dynamic layer
                 * @param  {Function}  targetFunction original `setVisibility` function from LAYER_GROUP
                 * @param  {Bollean}  value          target visibility value; if undefined, toggle visibility
                 * @param  {Boolean} isNotified     defaults to false; flag indicating if root was notified by a child; this is used to avoid multiple calls between root and children; if true, value is ignored
                 */
                function applyDynamicRootVisibility(targetFunction, value, isNotified = false) {
                    if (!isNotified) {
                        targetFunction(value, false);
                    }

                    console.log(tocEntry.name + ' set to ' + tocEntry.getVisibility());

                    // finally, set actual visibility :confetti_ball:
                    layer.layer.setVisibleLayers(tocEntry.getVisibility());
                }

                /**
                 * Set visibility of the dynamic layer leaf sublayer; notifies root if not suppressed
                 * @param  {Function} targetFunction original `setVisibility` function from LAYER_ITEM
                 * @param  {Boolean} value          target visibility value; if undefined, toggle visibility
                 * @param  {Boolean} notifyMaster   defaults to true; flag indicating if children should be notified; this is used to avoid multiple calls between root and children
                 */
                function applyDynamicLeafVisibility(targetFunction, value, notifyMaster = true) {
                    targetFunction(value);

                    if (notifyMaster) {
                        tocEntry.setVisibility(null, true);
                    }
                }
            }

            /**
             * Parses a tile layer object and creates a legend item (with nested groups and symbology)
             * Uses the same logic as dynamic layers to generate symbology hierarchy
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function tileGenerator(layer) {
                const tocEntry = createGroupedLayerEntry(layer);
                applySimpleVisibility(layer);

                // add all tile sublayers to the toc entry
                tocEntry.slaves.forEach(slave => tocEntry.add(slave));

                return tocEntry;
            }

            /**
             * Parses feature layer object and create a legend entry with symbology
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function featureGenerator(layer) {
                // merge default layer things
                layer.state = angular.merge(LAYER_ITEM(), layer.state);

                // decorate default setVisibility function to actually toggle visibility of the corresponding layer
                applySimpleVisibility(layer);

                const symbologyPromise = getMapServerSymbology(layer);
                const state = layer.state;

                symbologyPromise.then(
                    ({ data, index }) => applySymbology(state, data.layers[index]));

                return state;
            }

            /**
             * Parses esri image layer object and create a legend entry with symbology
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function imageGenerator(layer) {
                // merge default layer things
                layer.state = angular.merge(LAYER_ITEM(), layer.state);

                applySimpleVisibility(layer);

                const state = layer.state;

                state.symbology = [{
                    icon: NO_IMAGE,
                    name: state.name
                }];

                return state;
            }

            /**
             * Add a provided layer to the appropriate group;
             * TODO: hide groups with no layers;
             * @param {Object} layer object from `layerRegistry` `layers` object
             */
            function addLayer(layer) {
                const layerType = layer.state.layerType;
                const entry = layerTypeGenerators[layerType](layer);
                layer.entry = entry;

                layerTypeGroups[layerType].add(entry);
            }

            /**
             * Removes a provided layer from the appropriate group.
             * @param {Object} layer object from `layerRegistry` `layers` object
             */
            function removeLayer(layer) {
                layerTypeGroups[layer.state.layerType].remove(layer.state);
            }
        }

        // TODO: maybe this should be split into a separate service; it can get messy otherwise in here
        function structuredLegendService() {

        }

        /**
         * Sets visibility of a simple layer object, one which is represented by a single entry in the legend
         * @param  {Object} layer object from `layerRegistry`
         */
        function applySimpleVisibility(layer) {
            layer.state.decorate('setVisibility',
                (targetFunction, value) => {
                    targetFunction(value);
                    layer.layer.setVisibility(layer.state.getVisibility());
                }
            );

            // apply the initial visibility value
            layer.layer.setVisibility(layer.state.getVisibility());
        }

        /**
         * TODO: Work in progress... Works fine for feature layers only right now; everything else gest a generic icon;
         * TODO: move to geoapi as it's stateless and very specific
         * Scrapes feaure and dynamic layers for their symbology;
         *
         * * data.layers [
         *     {
         *         layerId: Number,
         *         legend: Array
         *     },
         *     ...
         * ]
         * @param  {Object} layer layer object from `layerRegistry`
         */
        function getMapServerSymbology(layer) {
            const reg = /(.+?)(\/(\d))?$/; // separate layer id from the rest of the url
            const url = layer.state.url.replace(/\/+$/, ''); // strip trailing slashes

            // jscs also doesn't like fancy destructuring
            // jscs:disable requireSpaceAfterComma
            const [, legendUrl,, index = -1] = reg.exec(url); // https://babeljs.io/docs/learn-es2015/#destructuring
            // jscs:enable requireSpaceAfterComma

            return $http.jsonp(`${legendUrl}/legend?f=json&callback=JSON_CALLBACK`)
                .then(result => {
                    // console.log(legendUrl, index, result);

                    if (result.data.error) {
                        return $q.reject(result.data.error);
                    }
                    return {
                        data: result.data,
                        index
                    };
                })
                .catch(error => {
                    // TODO: apply default symbology to the layer in question in this case
                    console.error(error);
                });
        }

        /**
         * Applies retrieved symbology to the layer item's state
         * @param  {Object} state     layer item
         * @param  {Object} layerData data from the legend endpoint
         */
        function applySymbology(state, layerData) {
            state.symbology = layerData.legend.map(item => {
                return {
                    icon: `data:${item.contentType};base64,${item.imageData}`,
                    name: item.label
                };
            });
        }
    }
})();
