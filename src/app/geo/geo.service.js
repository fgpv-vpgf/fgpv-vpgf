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

    function geoService($http, $q, gapiService, mapService, layerRegistry, configService, identifyService,
        LayerBlueprint) {

        // TODO update how the layerOrder works with the UI
        // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        // Add a function to update the layer order. This function will raise a change event so other interested
        // pieces of code can react to the change in the order

        const service = {
            isMapReady: false, // flag indicating that the map is ready

            epsgLookup,
            assembleMap,
            retrieveSymbol,
            reloadLayer: l => layerRegistry.reloadLayer(l),
            snapshotLayer: l => layerRegistry.snapshotLayer(l),

            state: null
        };

        return service;

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
         * When switching languages, switch language using `$translate` and call `assembleMap` without parameters. This will rebuild the map using the exising map node.
         *
         * ```js
         * $translate.use(lang);
         * geoService.assembleMap();
         * ```
         *
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

                    return layerRegistry(state, config);
                })
                .then(lr => {
                    // expose layerRegistry service on geoService
                    angular.extend(service, lr);

                    const layerBlueprints = config.layers.map(layerConfig =>
                        new LayerBlueprint.service(layerConfig));
                    service.constructLayers(layerBlueprints);

                    return identifyService(state);
                })
                .then(id => {
                    // expose idenitifyService on geoService
                    angular.extend(service, id);

                    service.state = state; // store geo state
                    service.isMapReady = true;

                    return service;
                })
                .catch(error => {
                    console.error('Failed to assemble the map');
                    console.error(error);
                });
        }

        /**
         * Retrieves base64 symbology icon for the item in datatable
         *
         * @param  {Integer} oid       object ID of the item which needs its symbology retrieved
         * @param  {Object} fData      feature data of the layer object of which the object belongs
         * @param  {Object} renderer   renderer object for the layer
         * @param  {Object} legend     legend look up object for the layer
         * @return {String} base64 string symbology for item in database
         */
        function retrieveSymbol(oid, fData, renderer, legend) {
            const sConfig = gapiService.gapi.symbology.createSymbologyConfig(renderer, legend);
            const icon = gapiService.gapi.symbology.getGraphicIcon(fData, sConfig, oid);
            return icon;
        }
    }
})();
