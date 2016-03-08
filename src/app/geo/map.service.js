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

    function mapService($q, gapiService) {
        let mapNode;

        const service = {
            map: null,

            mapNode: null,

            isReady: null,
            registerMapNode: null,
        };

        init();

        console.log(gapiService);

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
            if (typeof mapNode === 'undefined' && node) {
                mapNode = node;
                service.mapNode = node;
                resolve();
            }
        }
    }
})();
