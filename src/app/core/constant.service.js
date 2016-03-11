(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name configDefaults
     * @module app.core
     * @description
     *
     * The `configDefaults` constant service provides default config values.
     */
    /**
     * @ngdoc service
     * @name templateRegistry
     * @module app.core
     * @description
     *
     * The `templateRegistry` constant service provides template URLs.
     */
    angular
        .module('app.core')
        .constant('events', {
            rvReady: 'rvReady'
        })

        // this is populated with default schema snippets during build;
        .constant('configDefaults', '_DEFAULTS_')

        // construct layer default options and flags objects from schema snippets
        .service('layerDefaults', (configDefaults, layerTypeOptions) => {
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

            Object.keys(layerTypeOptions)
                .forEach(layerType => {
                    service[layerType] = {
                        // get default options for a specific layer type
                        options: configDefaults[layerTypeOptions[layerType]],

                        // flags are same for all layer types right now
                        flags: flagDefaults
                    };
                });

            return service;
        });
})();
