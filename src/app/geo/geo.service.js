/* global geoapi */
(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name geoService
     * @module app.geo
     *
     * @description
     * `geoService` wraps all calls to geoapi and also tracks the state of anything map related
     * (ex: layers, filters, extent history).
     */
    angular
        .module('app.geo')
        .factory('geoService', geoService);

    function geoService() {
        const service = {
            layers: {}
        };

        // FIXME: need to find a way to have the dojo URL set by the config
        service.promise = geoapi('//ec.cloudapp.net/~aly/esri/dojo/dojo.js', window)
            .then(initializedGeoApi => service.gapi = initializedGeoApi);

        return service;
    }
})();
