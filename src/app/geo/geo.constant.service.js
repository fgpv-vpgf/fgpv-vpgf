(() => {
    'use strict';

    const LAYER_TYPES = {
        esriDynamic: 'esriDynamic',
        esriFeature: 'esriFeature',
        esriImage: 'esriImage',
        esriTile: 'esriTile',
        ogcWms: 'ogcWms'
    };

    const LAYER_TYPE_OPTIONS = {
        esriDynamic: 'compoundLayerOptionsNode',
        esriFeature: 'featureLayerOptionsNode',
        esriImage: 'basicLayerOptionsNode',
        esriTile: 'basicLayerOptionsNode',
        ogcWms: 'compoundLayerOptionsNode'
    };

    // this is populated with default schema snippets during build;
    const LAYER_CONFIG_DEFAULTS = '_LAYER_CONFIG_DEFAULTS_';

    /**
     * @ngdoc service
     * @name layerTypes
     * @module app.geo
     * @description
     *
     * The `layerTypes` constant service provides a list of supported layer types.
     */
    angular
        .module('app.geo')
        .constant('layerTypes', LAYER_TYPES)
        .constant('layerTypeOptions', LAYER_TYPE_OPTIONS)

        // construct layer default options and flags objects from schema snippets
        .service('layerDefaults', layerTypeOptions => {
            const flagDefaults = {
                type: {
                    visible: true
                },
                data: {
                    visible: false
                },
                query: {
                    visible: false
                },
                user: {
                    visible: false
                },
                scale: {
                    visible: false
                }
            };

            const service = {};

            angular.forEach(layerTypeOptions, (value, key) => {
                service[key] = {
                    // get default options for a specific layer type
                    options: LAYER_CONFIG_DEFAULTS[value],

                    // flags are same for all layer types right now
                    flags: flagDefaults
                };
            });

            return service;
        });
})();
