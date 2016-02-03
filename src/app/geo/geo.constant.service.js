(() => {
    'use strict';

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
        .constant('layerTypes', {
            esriDynamic: 'esriDynamic',
            esriFeature: 'esriFeature',
            esriImage: 'esriImage',
            esriTile: 'esriTile',
            ogcWms: 'ogcWms'
        })
        .constant('configDefaults', { // FIXME: these defaults should be generated using `json-schema-defaults` module at build time
            layerOptions: {
                options: {
                    visibility: {
                        enabled: true,
                        value: 'on',
                    },
                    query: {
                        enabled: true,
                        value: true
                    },
                    metadata: {
                        enabled: true
                    },
                    settings: {
                        enabled: true
                    },
                    refresh: {
                        enabled: true
                    },
                    remove: {
                        enabled: true
                    },
                    boundingBox: {
                        enabled: true,
                        value: true
                    },
                    snapshot: {
                        enabled: true,
                        value: false
                    },
                    data: {
                        enabled: true
                    }
                }
            }
        });
})();
