import PluginLoader from 'api/../plugin-loader';

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

function geoService($rootScope, $rootElement, events, mapService, layerRegistry, configService, bookmarkService, legendService, appInfo, translationService, LEGACY_API) {

    // TODO update how the layerOrder works with the UI
    // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
    // Add a function to update the layer order. This function will raise a change event so other interested
    // pieces of code can react to the change in the order

    class GeoServiceInterface {

        constructor () {
            this._isMapReady = false;
            this._pluginLoader = false;
        }

        get isMapReady() { return this._isMapReady; }
        get map() { return configService.getSync.map.instance; }

        destroyMap() {
            this._pluginLoader.destroyer();
            appInfo.mapi.panels.all.slice(0).forEach(panel => {
                panel.destroy();
            });

            mapService.destroyMap();

            return this;
        }

        /**
         * Constructs a map on the given DOM node given the current config object.
         * When switching languages, switch language using `configService.setLang` and call `assembleMap`. This will rebuild the map using the exising map node.
         *
         * ```js
         * configService.setLang(lang);
         * geoService.assembleMap();
         * ```
         *
         * @function assembleMap
         * @return {Promise} resolving when all the map building is done
         */
        assembleMap() {
            return configService.getAsync.then(config => {
                // if any bookmark was loaded, apply it to the config
                // bookmarked changes to the layer definitions cannot be applied at this point as some layers migth be loaded through rcs keys
                // these changes are checked for and applied when a layerBlueprint is created
                if (bookmarkService.storedBookmark) {
                    config.applyBookmark(bookmarkService.storedBookmark);
                }

                if (this._pluginLoader) {
                    // TODO v3: Make optional plugin destroyer functionality
                    mapService.makeMap();
                    legendService.constructLegend(config.map.layers, config.map.legend);
                    this._isMapReady = true;
                    $rootScope.$broadcast(events.rvApiReady);
                } else {
                    this._pluginLoader = new PluginLoader(config, $rootElement);
                    this._pluginLoader.isReady.then(() => {
                        this._pluginLoader.loadTranslations(translationService);
                        mapService.makeMap();
                        appInfo.features = this._pluginLoader.features;
                        appInfo.plugins = this._pluginLoader.plugins;
                        legendService.constructLegend(config.map.layers, config.map.legend);
                        this._isMapReady = true;
                        $rootScope.$broadcast(events.rvApiReady);
                    });

                    events.$on(events.rvApiMapAdded, (_, mapi) => {
                        this._pluginLoader.init(mapi, LEGACY_API);
                    });
                }

                events.$on(events.rvCfgUpdated, (evt, layers) => {
                    let orderdBookmarkIds = bookmarkService.getOrderdBookmarkIds();
                    layers.forEach(layer => {
                        if (orderdBookmarkIds.length !== 0) {   // it is a bookmark
                            for (let i = 0; i < orderdBookmarkIds.length; i++) {
                                if (orderdBookmarkIds[i] === layer.id) {
                                    legendService.addLayerDefinition(layer, i);
                                    break;
                                } else if (layer.id.split('.')[0] === 'rcs' && orderdBookmarkIds[i].split('.')[1] === layer.id.split('.')[1]) {
                                    // if the layer is RCS and has the same key include it
                                    // fixes issues with using a bookmark to preserve state on page language switches
                                    legendService.addLayerDefinition(layer, i);
                                    break;
                                }
                            }
                        } else {
                            legendService.addLayerDefinition(layer);
                        }
                    });
                });
            }).catch(error => console.error('geoService', 'failed to assemble the map with error', error));
        }

        setFullExtent() {
            // TODO: check if this is true:
            // basemap extent should have the same projection as the map, so there is no need to reproject it and pass through `enhanceConfigExtent`
            this.setExtent(this.map.enhanceConfigExtent(configService.getSync.map.selectedBasemap.full));
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
            return this.map.setExtent(value, true);
        }

        setScale(value) {
            this.map.setScale(value);
        }

        addGraphicHighlight (graphicBundlePromise, showHaze) {
            mapService.addGraphicHighlight(graphicBundlePromise, showHaze);
        }

        zoomToFeature (proxy, oid) {
            mapService.zoomToFeature(proxy, oid);
        }

        getRcsLayerIDs () {
            return layerRegistry.getRcsLayerIDs();
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
