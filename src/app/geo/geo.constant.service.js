(() => {
    'use strict';

    const GEO = {
        Layer: {
            Types: {
                ESRI_DYNAMIC: 'esriDynamic',
                ESRI_FEATURE: 'esriFeature',
                ESRI_IMAGE: 'esriImage',
                ESRI_TILE: 'esriTile',
                OGC_WMS: 'ogcWms'
            },
            Ogc: {
                INFO_FORMAT_MAP: {
                    'text/html;fgpv=summary': 'HTML',
                    'text/html': 'HTML',
                    'text/plain': 'Text',
                    'application/json': 'EsriFeature'
                }
            },
            Esri: {
                GEOMETRY_TYPES: {
                    esriGeometryPoint: 'geometry.type.esriGeometryPoint',
                    esriGeometryPolygon: 'geometry.type.esriGeometryPolygon',
                    esriGeometryPolyline: 'geometry.type.esriGeometryPolyline',
                    generic: 'geometry.type.generic'
                }
            },
            States: { // these are used as css classes; hence the `rv` prefix
                NEW: 'rv-new',
                REFRESH: 'rv-refresh',
                LOADING: 'rv-loading',
                LOADED: 'rv-loaded', // TODO maybe loaded and default are the same?
                DEFAULT: 'rv-default',
                ERROR: 'rv-error'
            }
        },
        Service: {
            Types: {
                CSV: 'csv',
                GeoJSON: 'geojson',
                Shapefile: 'shapefile',
                FeatureLayer: 'featurelayer',
                RasterLayer: 'rasterlayer',
                GroupLayer: 'grouplayer',
                TileService: 'tileservice',
                FeatureService: 'featureservice',
                DynamicService: 'dynamicservice',
                ImageService: 'imageservice',
                WMS: 'wms',
                Unknown: 'unknown',
                Error: 'error'
            }
        }
    };

    angular.extend(GEO.Layer, {
        NO_ATTRS: [GEO.Layer.Types.ESRI_IMAGE, GEO.Layer.Types.ESRI_TILE, GEO.Layer.Types.OGC_WMS],
        QUERYABLE: [GEO.Layer.Types.ESRI_FEATURE, GEO.Layer.Types.ESRI_DYNAMIC, GEO.Layer.Types.OGC_WMS],
        SORT_GROUPS: [
            [GEO.Layer.Types.ESRI_FEATURE],
            [GEO.Layer.Types.ESRI_IMAGE, GEO.Layer.Types.ESRI_TILE,
             GEO.Layer.Types.ESRI_DYNAMIC, GEO.Layer.Types.OGC_WMS]
        ]
    });

    // this is populated with default schema snippets during build;
    const LAYER_CONFIG_DEFAULTS = '_LAYER_CONFIG_DEFAULTS_';
    GEO.Metadata = { XSLT_LANGUAGE_NEUTRAL: '_XSLT_BLOB_' };

    /**
     * @module Geo
     * @memberof app.geo
     * @description
     *
     * The `Geo` constant service is a container for all app.geo related constants.
     */
    angular
        .module('app.geo')
        .constant('Geo', GEO)
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
                },
                filterExtent: {
                    visible: false
                }
            };

            const service = {};

            const LAYER_TYPE_OPTIONS = {
                esriDynamic: 'dynamicLayerOptionsNode',
                esriDynamicLayerEntry: 'dynamicLayerEntryNode',
                esriFeature: 'featureLayerOptionsNode',
                esriImage: 'basicLayerOptionsNode',
                esriTile: 'basicLayerOptionsNode',
                ogcWms: 'compoundLayerOptionsNode',
                ogcWmsLayerEntry: 'wmsLayerEntryNode'
            };
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
