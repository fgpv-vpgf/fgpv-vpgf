(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name mapService
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `mapService` factory description.
     *
     */
    angular
        .module('app.geo')
        .factory('mapService', mapService);

    function mapService($q) {
        const service = {
            mapNode: null,
            map: null, // contains a reference to `mapManager`
            // { mapManager: <Object>, fullExtent: <Object> }

            isReady: null,
            registerMapNode: null,
        };

        init();

        return service;

        /***/

        /**
         * Sets an `isReady` promise resolving when the map node is registered.
         */
        function init() {
            service.isReady =
                $q((resolve, reject) =>
                    service.registerMapNode = (node => registerMapNode(resolve, reject, node))
                );
        }

        /**
         * Stores a reference to the map node.
         * @param  {Function} resolve function to resolve ready promise
         * @param  {Function} reject  function to reject ready promise
         * @param  {Object} node    dom node to build the map on
         */
        function registerMapNode(resolve, reject, node) {
            if (service.mapNode === null && node) {
                service.mapNode = node;
                resolve();
            }
        }

    }
})();
