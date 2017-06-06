/* global RV */

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
    identifyService, /*LayerBlueprint,*/ bookmarkService, ConfigObject, legendService, $timeout) {

    // TODO update how the layerOrder works with the UI
    // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
    // Add a function to update the layer order. This function will raise a change event so other interested
    // pieces of code can react to the change in the order

    class GeoServiceInterface {

        constructor () {
            this._isMapReady = false;
        }

        get isMapReady() { return this._isMapReady; }
        get map() { return configService.getSync.map.instance; }

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
        assembleMap(mapNode = null) {
            return configService.getAsync
                .then(config => {
                    this._isMapReady = false;

                    // if any bookmark was loaded, apply it to the config
                    // bookmarked changes to the layer definitions cannot be applied at this point as some layers migth be loaded through rcs keys
                    // these changes are checked for and applied when a layerBlueprint is created
                    if (bookmarkService.storedBookmark) {
                        config.applyBookmark(bookmarkService.storedBookmark);
                    }

                    mapService.makeMap(mapNode);

                    legendService.constructLegend(config.map.layers, config.map.legend);
                    this._isMapReady = true;
                    $rootScope.$broadcast(events.rvApiReady);
                })
                .catch(error => RV.logger.error('geoService', 'failed to assemble the map with error', error));
        }

        setFullExtent() {
            // TODO: check if this is true:
            // basemap extent should have the same projection as the map, so there is no need to reproject it and pass through `enhanceConfigExtent`
            this.map.setExtent(this.map.enhanceConfigExtent(configService.getSync.map.selectedBasemap.full));
        }

         /**
         * Check if visible extent is contained in the full extent.
         *
         * @function validateExtent
         * @param {Number} [factor = 1] multiplier used to expand the full extent
         * @return {Boolean} True if the visible extent is contained in the full extent - false if not contained
         */
        validateExtent(factor = 1) {
            return this.map.enhanceConfigExtent(configService.getSync.map.selectedBasemap.full)
                .expand(factor).contains(this.map.extent);
        }

        setExtent(value) {
            return this.map.setExtent(value);
        }

        setScale(value) {
            this.map.setScale(value);
        }

        // FIXME from Alex: reload and snapshop should be called against legendService
        reloadLayer(l) { layerRegistry.reloadLayer(l); }
        snapshotLayer(l) { layerRegistry.snapshotLayer(l); }

        get defaultExtent() {   return configService.getSync.map.selectedBasemap.default; }
        get fullExtent() {      return configService.getSync.map.selectedBasemap.full; }
        get maximumExtent() {   return configService.getSync.map.selectedBasemap.maximum; }
        get currentExtent () {  return this.map.extent; }
    }

    return new GeoServiceInterface();

}
