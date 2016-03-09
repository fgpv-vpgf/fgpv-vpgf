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
        .constant('layerTypeOptions', LAYER_TYPE_OPTIONS);
})();
