(() => {

    /**
     * @ngdoc service
     * @name bookmarkService
     * @module app.core
     *
     * @description
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

            const bookmark =  basemap + ',' + extent.x + ',' + extent.y + ',' + extent.zoom +
                ',' + layerBookmarks.toString();
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

            const info = bookmark.match(pattern);

            const basemap = decode64(info[1]);
            config.map.initialBasemapId = basemap;

            const x = decode64(info[2]);
            const y = decode64(info[3]);
            const zoom = decode64(info[4]);
            const thisBasemap = config.baseMaps.find(bm => bm.id === basemap);
            window.RV.getMap($rootElement.attr('id')).centerAndZoom(x, y, thisBasemap.wkid, zoom);

            const layers = info[5].split(',');
            const bmLayers = {};

            layers.forEach(layer => {
                layer = decode64(layer);
                const layerType = parseInt(layer.substring(0, 2));
                const [, layerId, layerData] = layer.substring(2).match(layerPatterns[layerType]);

                bmLayers[layerId] = LayerRecordFactory.parseLayerData(layerData, layerType);

            });

            let configLayers = config.layers;

            configLayers.slice().forEach(layer => {
                // get id
                const id = layer.id;
                const bookmarkLayer = bmLayers[id];
                if (bookmarkLayer) {

                    angular.merge(config.layers[config.layers.indexOf(layer)], bookmarkLayer);
                    console.log(config.layers[config.layers.indexOf(layer)]);

                    delete bmLayers[id];
                } else {
                    // layer was removed in bookmarked state, remove it from config object
                    delete config.layers[config.layers.indexOf(layer)];
                }
            });

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
