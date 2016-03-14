(() => {
    'use strict';

    // layer group ids should not collide
    let groupIdCounter = 0;

    const LAYER_GROUP = (name, expanded = false) => {
        return {
            type: 'group',
            name,
            id: 'lg_' + groupIdCounter++,
            expanded,
            items: [],

            // TODO: add hook to set group options
            options: {
                visibility: {
                    value: 'on', // 'off', 'zoomIn', 'zoomOut'
                    enabled: true
                }
            },

            add(item) {
                this.items.push(item);
            },

            remove(item) {
                const index = this.items.indexOf(item);
                if (index !== -1) {
                    this.items.splice(index, 1);
                }
            }
        };
    };

    /**
     * @ngdoc service
     * @name legendService
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `legendService` factory description.
     *
     */
    angular
        .module('app.geo')
        .factory('legendService', legendServiceFactory);

    // TODO: write comments;

    function legendServiceFactory() {
        const legendSwitch = {
            structured: structuredLegendService,
            autopopulate: autoLegendService
        };

        return (config, ...args) => legendSwitch[config.legend.type](config, ...args);

        function autoLegendService(config, layers, legend) {
            // TODO: need a way to change group names when language changes
            const ref = {
                dataGroup: LAYER_GROUP('Data layers', true),
                imageGroup: LAYER_GROUP('Image layers', true),
                root: legend.items
            };

            const layerTypeGroups = {
                esriDynamic: ref.dataGroup,
                esriFeature: ref.dataGroup,
                esriImage: ref.imageGroup,
                esriTile: ref.imageGroup,
                ogcWms: ref.imageGroup
            };

            const service = {
                addLayer,
                removeLayer,
                updateLegend
            };

            init();

            return service;

            /***/

            function init() {
                ref.root.push(ref.dataGroup, ref.imageGroup);
            }

            function updateLegend() {}

            /**
             * [addLayer description]
             * @param {Object} layer object from `layerRegistry` `layers` object
             */
            function addLayer(layer) {
                // TODO: remove; temp until scraper is donw
                layer.state.symbology = [
                    {
                        icon: 'url',
                        name: 'hello'
                    }
                ];
                layerTypeGroups[layer.state.layerType].add(layer.state);
            }

            function removeLayer(layer) {
                layerTypeGroups[layer.state.layerType].remove(layer.state);
            }
        }

        function structuredLegendService() {

        }
    }
})();
