const GEO = {
    Layer: {
        Types: {
            ESRI_GRAPHICS: 'esriGraphics',
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
    },
    SpatialReference: {
        CAN_ATLAS_LAMBERT: {
            wkids: [3978],
            latestWkid: 3978
        },
        WEB_MERCATOR: {
            wkids: [3857, 102100],
            latestWkid: 3857
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
    ],
    SORT_GROUPS_: {
        [GEO.Layer.Types.ESRI_DYNAMIC]: 1,
        [GEO.Layer.Types.ESRI_FEATURE]: 0,
        [GEO.Layer.Types.ESRI_IMAGE]: 1,
        [GEO.Layer.Types.ESRI_TILE]: 1,
        [GEO.Layer.Types.OGC_WMS]: 1
    }
});

/**
 * @module Geo
 * @memberof app.geo
 * @description
 *
 * The `Geo` constant service is a container for all app.geo related constants.
 */
angular
    .module('app.geo')
    .constant('Geo', GEO);
