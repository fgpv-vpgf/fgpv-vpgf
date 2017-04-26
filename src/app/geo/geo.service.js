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
        identifyService, /*LayerBlueprint,*/ ConfigObject, legendService) {

        // TODO update how the layerOrder works with the UI
        // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        // Add a function to update the layer order. This function will raise a change event so other interested
        // pieces of code can react to the change in the order

        const service = {
            isMapReady: false, // flag indicating that the map is ready
            // epsgLookup,
            assembleMap,
            reloadLayer: l => layerRegistry.reloadLayer(l),
            snapshotLayer: l => layerRegistry.snapshotLayer(l),

            state: null,

            configObject: null
        };

        return service;

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

            return configService.getAsync
                .then(config => {
                    mapService.makeMap(mapNode);
                    config.map.legendBlocks = legendService.constructLegend(config.map.layers, config.map.legend);
                    service.isMapReady = true;
                    $rootScope.$broadcast(events.rvApiReady);
                })
                .catch(error => RV.logger.error('geoService', 'failed to assemble the map with error', error));

        }
/*
            return configService.getCurrent()
                .then(cf => {
                    config = cf;

                    configService._sharedConfig_ = new ConfigObject.ConfigObject(config);

                    // TODO: remove after config is typed and returns proper typed objects;
                    // it's like this will have to be moved to the mapService or something
                    state.configObject = service.configObject = configService._sharedConfig_;


                    return true;

                    // state._map = service._map = basemapService.constructBasemaps(config);

                    // assemble geo state object
                    // return mapService(state, config);
                })
                .then(ms => {
                    // expose mapService on geoService
                    angular.extend(service, ms);


                    // layers.forEach(layer =>
                        // state.mapService.mapObject.addLayer(layer._layer));

                    // basemapService.reload();

                    return true; //layerRegistry(state, config);
                })
                .then(lr => {
                    // expose layerRegistry service on geoService
                    angular.extend(service, lr);

                    // TODO: move blueprint construction to the layer registry
                    // const layerBlueprints = config.layers.map(layerConfig =>
                    //     new LayerBlueprint.service(layerConfig, epsgLookup));
                    // service.constructLayers(layerBlueprints);

                    // service.constructLayers([]);

                    // return identifyService(state);

                    return true;
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
        */

    }
})();
