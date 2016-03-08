/* global RV */
(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name gapi
     * @module app.geo
     * @requires $q
     * @description
     *
     * The `gapi` factory exposes `geoApi` interface after it's loaded. Modules should not access `gapi` property before it's set. It's safe though since `core.run` block waits for `gapi` to be ready before kicking in the app into gear.
     *
     */
    angular
        .module('app.geo')
        .factory('gapiService', gapi);

    function gapi($q) {
        // wait for `gapiPromise` from the global registry to resolve
        const initializePromise = RV.gapiPromise;

        const service = {
            gapi: null, // actual gapi interface; available after gapiPromise resovles
            ready
        };

        return service;

        /***/

        /**
         * Checks if the service is ready to use.
         * @return {Promise} promise to be resolved when gapi loads
         */
        function ready() {
            return initializePromise
                .then(gapi => {
                    service.gapi = gapi;
                    console.info('gapi is ready');
                    return $q.resolve(null);
                })
                .catch(() => {
                    console.error('gapi is not ready :(');
                });
        }
    }
})();
