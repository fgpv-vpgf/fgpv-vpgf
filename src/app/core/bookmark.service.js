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

    function bookmarkService($rootElement, $q, legendService, geoService, LayerBlueprint,
            LayerRecordFactory, configService, gapiService, bmVer) {

        const blankPrefix = 'blank_basemap_';

        const service = {
            getBookmark,
            parseBookmark
        };

        return service;

        /************************/

        /**
         * Creates a bookmark containing the current state of the viewer
         *
         * @function getBookmark
         * @returns {String}    The bookmark containing basemap, extent, layers and their options
         */
        function getBookmark() {
            // TODO: possibly race condition to clean up or need basemapService to expose original projection

            // we tack a flag at the end to indicate if we were in blank mode or not
            const bmkey = geoService.mapManager.BasemapControl.basemapGallery.getSelected().id +
                (geoService.state.blankBaseMapId ? '1' : '0');
            const basemap = encode64(bmkey);

            const mapExtent = geoService.mapObject.extent.getCenter();

            // get zoom scale
            // get center coords
            const extent = {
                x: encode64(mapExtent.x),
                y: encode64(mapExtent.y),
                scale: encode64(geoService.mapObject.getScale())
            };

            // loop through layers in legend, remove user added layers and "removed" layer which are in the "undo" time frame
            const legend = geoService.legend.items.filter(legendEntry =>
                !legendEntry.flags.user.visible && !legendEntry.removed);
            const layerBookmarks = legend.map(legendEntry => {
                // FIXME: remove moving through _layerRecord
                return encode64(legendEntry._layerRecord.makeLayerBookmark());
            });

            // bmVer.? is the version. update this accordingly whenever the structure of the bookmark changes
            const bookmark = `${bmVer.B},${basemap},${extent.x},${extent.y},${extent.scale}` +
                (layerBookmarks.length > 0 ? `,${layerBookmarks.toString()}` : '');
            console.log(bookmark);
            return bookmark;

        }

        /**
         * Reads and applies the options specified by bookmark to config
         *
         * @function parseBookmark
         * @param {String} bookmark     A bookmark created by getBookmark
         * @param {Object} origConfig   The config object to modify
         * @param {Array} newKeyList    Optional modified RCS key list
         * @param {String} newBaseMap   Optional new basemap id we are switching to
         * @returns {Object}            The config with changes from the bookmark
         */
        function parseBookmark(bookmark, origConfig, newKeyList, newBaseMap) {
            // this methods uses a lot of sub-methods because of the following rules
            // RULE #1 single method can't have more than 40 commands
            // RULE #2 obey all rules

            const config = angular.copy(origConfig);

            const dBookmark = decodeURI(bookmark);

            console.log(dBookmark);

            const version = dBookmark.match(/^([^,]+)/)[0];
            let blankBaseMap = false;
            let basemap;
            let x;
            let y;
            let scale;
            let layers;

            /**
             * Extracts and decodes the top level parts of the bookmark.
             *
             * @function decodeMainBookmark
             * @private
             */
            function decodeMainBookmark() {
                const pattern = /^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)(?:$|,(.*)$)/i;
                const info = dBookmark.match(pattern);

                // pull out non-layer info
                const chunks = [2, 3, 4, 5].map(i => decode64(info[i]));
                basemap = chunks[0];
                x = chunks[1];
                y = chunks[2];
                scale = chunks[3];

                // also store any layer info
                layers = info[6];

                if (version !== bmVer.A) {
                    blankBaseMap = basemap.substr(basemap.length - 1, 1) === '1';
                    basemap = basemap.substring(0, basemap.length - 1);
                }
            }

            decodeMainBookmark();

            // mark initial basemap
            config.map.initialBasemapId = newBaseMap || basemap;

            const origBasemapConfig = config.baseMaps.find(bm => bm.id === basemap);
            if (blankBaseMap && !newBaseMap) {
                // we are not doing a schema change, and the basemap on the bookmark has the blank
                // flag set. Override the initial setting to be the blank key for the correct
                // projection.
                // TODO if possible, set geoService.state.blankBaseMapId = basemap;
                config.map.initialBasemapId = blankPrefix + origBasemapConfig.wkid;
            }

            // apply extent
            const bookmarkSR = {
                wkid: origBasemapConfig.wkid
            };
            const mapSR = {
                wkid: origBasemapConfig.wkid
            };

            // determine the zoom level. use bookmark basemap unless we are doing a projection switch
            let lodId = origBasemapConfig.lodId;
            let extentId = origBasemapConfig.extentId;

            /**
             * Does special logic to handle the case where we are using a bookmark
             * to change basemap schema.
             *
             * @function processSchemaChangeBookmark
             * @private
             */
            function processSchemaChangeBookmark() {
                let newBasemapConfig;
                if (newBaseMap.indexOf(blankPrefix) === 0) {
                    // we are changing schemas, but are initializing with the blank basemap.
                    // need to find the first valid basemap in the new collection
                    // and steal it's settings for extents and lods.
                    // blank basemap codes start with the prefix and end with the WKID
                    const newWkid = parseInt(newBaseMap.substr(blankPrefix.length));
                    newBasemapConfig = config.baseMaps.find(bm => bm.wkid === newWkid);
                } else {
                    // just grab the config for the given basemap id
                    newBasemapConfig = config.baseMaps.find(bm => bm.id === newBaseMap);
                }

                lodId = newBasemapConfig.lodId;
                extentId = newBasemapConfig.extentId;
                mapSR.wkid = newBasemapConfig.wkid;
            }

            if (newBaseMap) {
                processSchemaChangeBookmark();
            }

            /**
             * Derives an initial extent using information from the bookmark
             * and the config file
             *
             * @function deriveBookmarkExtent
             * @private
             * @returns {Object}            An extent where the map should initialize
             */
            function deriveBookmarkExtent() {
                // find the LOD set for the basemap in the config file,
                // then find the LOD closest to the scale provided by the bookmark.
                const configLodSet = config.map.lods.find(lodset => lodset.id === lodId);
                const zoomLod = gapiService.gapi.mapManager.findClosestLOD(configLodSet.lods, scale);

                // Note: we used to use a centerAndZoom() call to position the map to the basemap co-ords.
                //       it was causing a race condition during a projection change, so we now calculate
                //       the new initial extent and set it prior to map creation.

                // project bookmark point to the map's spatial reference
                const coords = gapiService.gapi.proj.localProjectPoint(bookmarkSR, mapSR, { x: x, y: y });
                const zoomPoint = gapiService.gapi.proj.Point(coords.x, coords.y, mapSR);

                // using resolution of our target level of detail, and the size of the map in pixels,
                // calculate a rough extent of where our map should initialize.
                const domNode = $rootElement.find('rv-shell')[0];
                const xOffset = domNode.offsetWidth * zoomLod.resolution / 2;
                const yOffset = domNode.offsetHeight * zoomLod.resolution / 2;
                return {
                    xmin: zoomPoint.x - xOffset,
                    xmax: zoomPoint.x + xOffset,
                    ymin: zoomPoint.y - yOffset,
                    ymax: zoomPoint.y + yOffset,
                    spatialReference: zoomPoint.spatialReference
                };
            }

            const zoomExtent = deriveBookmarkExtent();

            // update the config file default extent.  if we don't have a full extent defined,
            // copy the original default to the full.  otherwise our zoom-to-canada button
            // will start zooming to our new initial extent.
            const configExtSet = config.map.extentSets.find(extset => extset.id === extentId);
            if (!configExtSet.full) {
                configExtSet.full = configExtSet.default;
            }
            configExtSet.default = zoomExtent;

            let bookmarkLayers = {};

            // Make sure there are layers before trying to loop through them
            if (layers) {
                const layerData = layers.split(',');

                // create partial layer configs from layer bookmarks
                bookmarkLayers = parseLayers(layerData, version);

                // modify main config using layer configs
                filterConfigLayers(bookmarkLayers, config);
            }

            if (newKeyList) {
                modifyRcsKeyList(bookmarkLayers, newKeyList);
            }

            // set the new current config, RCS layers will be loaded on first getCurrent() call
            configService.setCurrent(addRcsConfigs(bookmarkLayers, config));
        }

        /**
         * Turns layer bookmarks into partial layer configs
         *
         * @function parseLayers
         * @param {Array} layerDataStrings      Array of layer bookmarks
         * @param {String} version              Version of the bookmark
         * @returns {Object}                    Partial configs created from each layer bookmark
         */
        function parseLayers(layerDataStrings, version) {
            const layerPatterns = {};

            layerPatterns[bmVer.A] = [
                /^(.+?)(\d{7})$/, // feature
                /^(.+?)(\d{6})$/, // wms
                /^(.+?)(\d{5})$/, // tile
                /^(.+?)(\d{6})$/, // dynamic
                /^(.+?)(\d{5})$/ // image
            ];

            layerPatterns[bmVer.B] = [
                /^(.+?)(\d{6})$/, // feature
                /^(.+?)(\d{5})$/, // wms
                /^(.+?)(\d{4})$/, // tile
                /^(.+?)([;].*\d{5})$/, // dynamic
                /^(.+?)(\d{4})$/ // image
            ];

            const layerObjs = {};
            // Loop through bookmark layers and create config snippets
            layerDataStrings.forEach(layer => {
                layer = decode64(layer);
                const layerType = parseInt(layer.substring(0, 2));
                const [, layerId, layerData] = layer.substring(2).match(layerPatterns[version][layerType]);

                layerObjs[layerId] = LayerRecordFactory.parseLayerData(layerData, layerType, version);
            });

            return layerObjs;
        }

        /**
         * Updates layers in the config, merging the layerObj if they are in the bookmark & deleting the ones not present. *Modifies both params*
         *
         * @function filterConfigLayers
         * @param {Object} layerObjs    Object containing partial layer configs
         * @param {Object} config       The config object to modify
         */
        function filterConfigLayers(layerObjs, config) {
            let configLayers = config.layers;

            // Loop through config layers and apply bookmark info
            configLayers.slice().forEach(layer => {
                const id = layer.id;
                const bookmarkLayer = layerObjs[id];
                if (bookmarkLayer) {
                    // apply bookmark layer info to config
                    angular.merge(config.layers[config.layers.indexOf(layer)], bookmarkLayer);

                    delete layerObjs[id];
                } else {
                    // layer was removed in bookmarked state, remove it from config object
                    delete config.layers[config.layers.indexOf(layer)];
                }
            });
        }

        /**
         * Updates layers in 'layerObjs' so that it matches 'keys'. *Modifies both params*
         *
         * @function modifyRcsKeyList
         * @param {Object} layerObjs    Object containing partial layer configs
         * @param {Array} keys          List containing all wanted rcs keys
         */
        function modifyRcsKeyList(layerObjs, keys) {
            // Loop through keys in layerObjs
            Object.keys(layerObjs).forEach(id => {
                // strip rcs. and .en/.fr from the layer id
                const plainID = id.split('.')[1];
                if (keys.indexOf(plainID) > -1) {
                    // id is in both layerObjs and keys, safe to remove from keyList
                    delete keys[keys.indexOf(plainID)];
                } else {
                    // id isn't in keys, remove from layerObjs (assumed to be removed from cart)
                    delete layerObjs[id];
                }
            });

            // for each of the remaining keys in the new list
            // add them to layerObjs to be loaded
            keys.forEach(id => {
                layerObjs[id] = {};
            });
        }

        /**
         * Adds RCS layers to a config, used to modify a bookmark config before first use
         *
         * @function addRcsConfigs
         * @private
         * @param {Object} rcsBookmarks     Config snippets for rcs layers created from a bookmark
         * @param {Object} config           The config to add the final rcs layers to
         * @returns {Promise}               A promise that resolves with the modified config
         */
        function addRcsConfigs(rcsBookmarks, config) {
            if (Object.keys(rcsBookmarks).length > 0) {
                return configService.rcsAddKeys(Object.keys(rcsBookmarks).map(id => (id.split('.')[1] || id)))
                    .then(rcsConfigs => {
                        const configSnippets = rcsConfigs.map(cfg =>
                                angular.merge(cfg, rcsBookmarks[cfg.id], { origin: 'rcs' }));
                        config.layers = config.layers.concat(configSnippets);

                        return config;
                    })
                    .catch(() => config);
            }

            return $q.resolve(config);
        }

        /**
         * Encodes the string using base64 and replaces '/' and '+'. This is a URL safe encoding; https://tools.ietf.org/html/rfc4648#page-7
         *
         * @function encode64
         * @private
         * @param {String} string   The string to encode
         * @returns {String}        The encoded string
         */
        function encode64(string) {
            return btoa(string).replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
        }

        /**
         * Decodes a string that was encoded using {@link encode64}. URL safe; https://tools.ietf.org/html/rfc4648#page-7
         *
         * @function decode64
         * @private
         * @param {String} string   The string to decode
         * @returns {String}        The decoded string
         */
        function decode64(string) {
            return atob(string.replace(/_/g, '/').replace(/-/g, '+'));
        }
    }
})();
