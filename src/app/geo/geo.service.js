/* global RV */
(() => {
    'use strict';

    /**
     * @module geoService
     * @memberof app.geo
     * @requires $http, $q, mapService, layerRegistry, configService, identifyService
     *
     * @description
     * `geoService` wraps all calls to geoapi and also tracks the state of anything map related
     * (ex: layers, filters, extent history).
     */
    angular
        .module('app.geo')
        .factory('geoService', geoService);

    function geoService($http, $q, $rootScope, events, mapService, layerRegistry, configService,
        identifyService, LayerBlueprint, basemapService) {

        // TODO update how the layerOrder works with the UI
        // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        // Add a function to update the layer order. This function will raise a change event so other interested
        // pieces of code can react to the change in the order

        const service = {
            isMapReady: false, // flag indicating that the map is ready
            epsgLookup,
            assembleMap,
            reloadLayer: l => layerRegistry.reloadLayer(l),
            snapshotLayer: l => layerRegistry.snapshotLayer(l),

            state: null
        };

        return service;

        /**
         * Lookup a proj4 style projection definition for a given ESPG code.
         * @function epsgLookup
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
                    RV.logger.warn('geoService', 'proj4 style projection lookup failed with error', err);
                    // jscs check doesn't realize return null; returns a promise
                    return null; // jscs:ignore jsDoc
                });
        }

        /**
         * Constructs a map on the given DOM node given the current config object.
         * When switching languages, switch language using `$translate` and call `assembleMap` without parameters. This will rebuild the map using the exising map node.
         *
         * ```js
         * $translate.use(lang);
         * geoService.assembleMap();
         * ```
         *
         * @function assembleMap
         * @param  {Object} mapNode    dom node to build the map on; need to be specified only the first time the map is created;
         * @return {Promise} resolving when all the map building is done
         */
        function assembleMap(mapNode) {
            // reuse the previous state or create the new one
            // when reusing existing state, its map will be destroyed
            const state = service.state || {
                mapNode: mapNode
            };

            let config; // reference to the current config

            return configService.getCurrent()
                .then(cf => {
                    config = cf;

                    // assemble geo state object
                    return mapService(state, config);
                })
                .then(ms => {
                    // expose mapService on geoService
                    angular.extend(service, ms);
                    basemapService.reload();
                    return layerRegistry(state, config);
                })
                .then(lr => {
                    // expose layerRegistry service on geoService
                    angular.extend(service, lr);

                    const layerBlueprints = config.layers.map(layerConfig =>
                        new LayerBlueprint.service(layerConfig, epsgLookup));
                    service.constructLayers(layerBlueprints);

                    return identifyService(state);
                })
                .then(id => {
                    // expose idenitifyService on geoService
                    angular.extend(service, id);

                    service.state = state; // store geo state
                    service.isMapReady = true;
                    $rootScope.$broadcast(events.rvApiReady);

                    return service;
                })
                .catch(error => RV.logger.error('geoService', 'failed to assemble the map with error', error));
        }

    }
})();
