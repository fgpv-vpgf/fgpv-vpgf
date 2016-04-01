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
        esriDynamic: 'dynamicLayerOptionsNode',
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
        .constant('layerStates', { // these are used as css classes; hence the `rv` prefix
            default: 'rv-default',
            error: 'rv-error'
        })
        .service('layerDefaults', layerTypeOptions => {
            // construct layer default options and flags objects from schema snippets
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

            Object.entries(layerTypeOptions)
                .forEach(([key, value]) => {
                    service[key] = {
                        // get default options for a specific layer type
                        options: LAYER_CONFIG_DEFAULTS[value],

                        // flags are same for all layer types right now
                        flags: angular.merge({},
                            flagDefaults, {
                                // set type flag to the layer type
                                type: {
                                    value: key
                                }
                            })
                    };
                });

            return service;
        });
})();
