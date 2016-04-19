(() => {
    'use strict';

    const LAYER_TYPES = {
        esriDynamic: 'esriDynamic',
        esriFeature: 'esriFeature',
        esriImage: 'esriImage',
        esriTile: 'esriTile',
        ogcWms: 'ogcWms'
    };

    const LAYER_NOATTRS = ['esriImage', 'esriTile', 'ogcWms'];

    const WMS_INFO_MAP = {
        'text/html;fgpv=summary': 'HTML',
        'text/html': 'HTML',
        'text/plain': 'Text',
        'application/json': 'EsriFeature'
    };

    const LAYER_TYPE_OPTIONS = {
        esriDynamic: 'dynamicLayerOptionsNode',
        esriDynamicLayerEntry: 'dynamicLayerEntryNode',
        esriFeature: 'featureLayerOptionsNode',
        esriImage: 'basicLayerOptionsNode',
        esriTile: 'basicLayerOptionsNode',
        ogcWms: 'compoundLayerOptionsNode',
        ogcWmsLayerEntry: 'wmsLayerEntryNode'
    };

    const GEOMETRY_TYPES = {
        esriGeometryPoint: 'geometry.type.esriGeometryPoint',
        esriGeometryPolygon: 'geometry.type.esriGeometryPolygon',
        esriGeometryPolyline: 'geometry.type.esriGeometryPolyline',
        generic: 'geometry.type.generic'
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
        .constant('layerStates', { // these are used as css classes; hence the `rv` prefix
            default: 'rv-default',
            error: 'rv-error'
        })
        .constant('geometryTypes', GEOMETRY_TYPES)
        .constant('layerNoattrs', LAYER_NOATTRS)
        .constant('wmsInfoMap', WMS_INFO_MAP)
        .service('layerDefaults', () => {
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

            Object.entries(LAYER_TYPE_OPTIONS)
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
