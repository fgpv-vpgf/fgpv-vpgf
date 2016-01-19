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
            ogcWms: 'ogcWms'
        });
})();
