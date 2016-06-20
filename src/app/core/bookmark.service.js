(() => {

    /**
     * @ngdoc service
     * @name bookmarkService
     * @module app.core
     *
     * @description bookmarkService handles creation and parsing of bookmarks.
     *
     */
    angular
        .module('app.core')
        .factory('bookmarkService', bookmarkService);

    function bookmarkService($rootElement, legendService, geoService, LayerBlueprint, LayerRecordFactory,
            configService) {

        const service = {
            getBookmark,
            parseBookmark
        };

        return service;

        /************************/

        function getBookmark() {
            const basemap = encode64(geoService.mapManager.BasemapControl.basemapGallery.getSelected().id);

            const mapExtent = geoService.mapObject.extent.getCenter();

            // get zoom level
            // get center coords
            const extent = {
                x: encode64(mapExtent.x),
                y: encode64(mapExtent.y),
                zoom: encode64(geoService.mapObject.getZoom())
            };

            // loop through layers in registry
            const layers = geoService.legend.items;
            const layerBookmarks = layers.map(layer => {
                // if not user added
                return encode64(layer._layerRecord.makeLayerBookmark());
            });

            const bookmark = `${basemap},${extent.x},${extent.y},${extent.zoom},${layerBookmarks.toString()}`;
            console.log(bookmark);
            return bookmark;

        }

        function parseBookmark(bookmark, config) {
            const pattern = /^([^,]+),([^,]+),([^,]+),([^,]+),(.*)$/i;
            const layerPatterns = [
                /^(.+?)(\d{7})$/, // feature
                /^(.+?)(\d{6})$/, // wms
                /^(.+?)(\d{5})$/, // tile
                /^(.+?)(\d{6})$/, // dynamic
                /^(.+?)(\d{5})$/ // image
            ];

            bookmark = decodeURI(bookmark);

            console.log(bookmark);

            const info = bookmark.match(pattern);

            // pull out non-layer info
            const [basemap, x, y, zoom] = [1, 2, 3, 4].map(i => decode64(info[i]));

            // mark initial basemap
            config.map.initialBasemapId = basemap;

            // apply extent
            const spatialReference = {
                wkid: config.baseMaps.find(bm => bm.id === basemap).wkid
            };
            window.RV.getMap($rootElement.attr('id')).centerAndZoom(x, y, spatialReference, zoom);

            const layers = info[5].split(',');
            const bmLayers = {};

            // Loop through bookmark layers and create config snippets
            layers.forEach(layer => {
                layer = decode64(layer);
                const layerType = parseInt(layer.substring(0, 2));
                const [, layerId, layerData] = layer.substring(2).match(layerPatterns[layerType]);

                bmLayers[layerId] = LayerRecordFactory.parseLayerData(layerData, layerType);

            });

            let configLayers = config.layers;

            // Loop through config layers and apply bookmark info
            configLayers.slice().forEach(layer => {
                const id = layer.id;
                const bookmarkLayer = bmLayers[id];
                if (bookmarkLayer) {
                    // apply bookmark layer info to config
                    angular.merge(config.layers[config.layers.indexOf(layer)], bookmarkLayer);

                    delete bmLayers[id];
                } else {
                    // layer was removed in bookmarked state, remove it from config object
                    delete config.layers[config.layers.indexOf(layer)];
                }
            });

            // Loops through remaining bookmark layers and tries to pull them from rcs
            configService.rcsAddKeys(Object.keys(bmLayers).map(id => id.split('.')[1]))
                .then(rcsConfigs => {
                    rcsConfigs.forEach(rcsConfig => {
                        angular.merge(rcsConfig, bmLayers[rcsConfig.id]);

                        const blueprint = new LayerBlueprint.service(rcsConfig);
                        console.log(blueprint);
                    });
                });
        }

        function encode64(string) {
            return btoa(string).replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
        }

        function decode64(string) {
            return atob(string.replace(/_/g, '/').replace(/-/g, '+'));
        }
    }
})();
