(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name geoService
     * @module app.geo
     * @requires $http, $q, gapiService, mapService, layerRegistry, configService, identifyService
     *
     * @description
     * `geoService` wraps all calls to geoapi and also tracks the state of anything map related
     * (ex: layers, filters, extent history).
     */
    angular
        .module('app.geo')
        .factory('geoService', geoService);

    function geoService($http, $q, gapiService, mapService, layerRegistry, configService, identifyService) {

        // TODO update how the layerOrder works with the UI
        // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        // Add a function to update the layer order. This function will raise a change event so other interested
        // pieces of code can react to the change in the order

        const ref = {
            mapNode: null
        };

        const service = {
            isReady: null,
            registerMapNode: null,

            epsgLookup,
            assembleMap,

            state: null
        };

        init();

        return service;

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
            if (ref.mapNode === null) {
                ref.mapNode = node;
                resolve();
            }
        }

        /**
         * Lookup a proj4 style projection definition for a given ESPG code.
         * @param {string|number} code the EPSG code as a string or number
         * @return {Promise} a Promise resolving to proj4 style definition or null if the definition could not be found
         */
        function epsgLookup(code) {
            // FIXME this should be moved to a plugin; it is hardcoded to use epsg.io

            const urnRegex = /urn:ogc:def:crs:EPSG::(\d+)/;
            const epsgRegex = /EPSG:(\d+)/;
            let lookup = code;
            if (typeof lookup === 'number') {
                lookup = String(lookup);
            }
            const urnMatches = lookup.match(urnRegex);
            if (urnMatches) {
                lookup = urnMatches[1];
            }
            const epsgMatches = lookup.match(epsgRegex);
            if (epsgMatches) {
                lookup = epsgMatches[1];
            }

            return $http.get(`http://epsg.io/${lookup}.proj4`)
                .then(response => {
                    return response.data;
                })
                .catch(err => {
                    console.warn(err);

                    // jscs check doesn't realize return null; returns a promise
                    return null; // jscs:ignore jsDoc
                });
        }

        /**
         * Constructs a map on the given DOM node given the current config object.
         * @return {Promise} resolving when all the map building is done
         * TODO: break this function and move some of it (stuff related to actual map building) to `mapService.buildMapObject` function
         */
        function assembleMap() {
            const state = {
                mapNode: ref.mapNode
            };

            // assemble geo state object
            return mapService(state)
                .then(ms => {
                    // expose mapService on geoService
                    angular.extend(service, ms);

                    return layerRegistry(state);
                })
                .then(lr => {
                    // expose layerRegistry service on geoService
                    angular.extend(service, lr);

                    return identifyService(state);
                })
                .then(id => {
                    // expose idenitifyService on geoService
                    angular.extend(service, id);

                    // store geo state
                    service.state = state;

                    return service;
                })
                .catch(error => {
                    console.error('Failed to assemble the map');
                    console.error(error);
                });
        }
    }
})();
