(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name mapService
     * @module app.geo
     * @requires $q
     * @description
     *
     * The `mapService` factory holds references to the map dom node and the currently active map object.
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

            buildMapObject,

            isReady: null,
            registerMapNode: null
        };

        init();

        return service;

        /***/

        // TODO: placeholder function
        function buildMapObject() {}

        /**
         * Sets an `isReady` promise resolving when the map node is registered.
         */
        function init() {
            service.isReady =
                $q(resolve =>
                    service.registerMapNode = (node => registerMapNode(resolve, node))
                );
        }

        /**
         * Stores a reference to the map node.
         * @param  {Function} resolve function to resolve ready promise
         * @param  {Object} node    dom node to build the map on
         */
        function registerMapNode(resolve, node) {
            if (service.mapNode === null) {
                service.mapNode = node;
                resolve();
            }
        }
    }
})();
