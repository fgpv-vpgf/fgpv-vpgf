(() => {
    'use strict';

    angular
        .module('app.core')
        .run(apiBlock)
        .run(runBlock);

    /**
     * @function runBlock
     * @private
     * @memberof app.core
     * @description
     *
     * The `runBlock` triggers config and locale file loading, sets language of the app.
     */
    function runBlock($rootScope, $rootElement, $translate, $q, globalRegistry, reloadService, events, configService,
            gapiService) {

        const promises = [
            configService.initialize(),
            gapiService.isReady
        ];

        // wait on the config and geoapi
        $q.all(promises)
            .then(() => {
                readyDelay();
            })
            .catch(reason => {
                console.error('Everything broke');
                console.error(reason);
            });

        // to prevent FOUC (flash of unstyled content) need to load translation
        // files with config initialization if we know the language
        // $rootScope.$on('$translateLoadingSuccess', data => console.log(data));
        $rootScope.$on('$translateLoadingSuccess', () => console.log(
            '$translateLoadingSuccess ->'));

        /********************/

        /**
         * Waits on bookmark to modify the config if needed
         *
         */
        function readyDelay() {
            const waitAttr = $rootElement.attr('rv-wait');

            preLoadApiBlock();

            if (waitAttr !== undefined) {
                $rootScope.$on(events.rvBookmarkInit, () => {
                    $rootScope.$broadcast(events.rvReady);
                });
            } else {
                $rootScope.$broadcast(events.rvReady);
            }
        }

        function preLoadApiBlock() {
            const preMapService = {
                initialBookmark,
            };

            globalRegistry.getMap($rootElement.attr('id'))._registerPreLoadApi(preMapService);

            /******************/

            function initialBookmark(bookmark) {
                reloadService.loadWithBookmark(bookmark, true);
            }

        }
    }

    /**
     * @function
     * @private
     * @memberof app.core
     * @description
     *
     * `apiBlock` sets up language and RCS calls for the global API
     */
    function apiBlock($rootElement, $rootScope, globalRegistry, geoService, configService, events,
        LayerBlueprint, bookmarkService, gapiService, reloadService) {

        const service = {
            setLanguage,
            loadRcsLayers,
            getBookmark,
            centerAndZoom,
            useBookmark
        };

        // Attaches a promise to the appRegistry which resolves with apiService
        $rootScope.$on(events.rvApiReady, () => {
            globalRegistry.getMap($rootElement.attr('id'))._registerMap(service);
            console.log($rootElement.attr('id') + ' registered');
        });

        /**********************/

        /**
         * Sets the translation language and reloads the map
         *
         * @memberof app.core
         * @function
         * @inner
         * @param {String}  lang    the language to switch to
         */
        function setLanguage(lang) {
            reloadService.loadNewLang(lang);
        }

        /**
         * Load RCS layers after the map has been instantiated
         *
         * @memberof app.core
         * @function
         * @inner
         * @param {Array}  keys  array of RCS keys (String) to be added
         */
        function loadRcsLayers(keys) {

            // trigger RCS web call, insert into config
            configService.rcsAddKeys(keys)
                .then(newLayerConfigs => {
                    // call layer register in geo module on those nodes
                    const layerBlueprints = newLayerConfigs.map(layerConfig =>
                        new LayerBlueprint.service(layerConfig, geoService.epsgLookup));
                    geoService.constructLayers(layerBlueprints);
                });

        }

        /**
         * Retrieves a bookmark for the current state
         *
         * @returns {String}    The bookmark containing the state of the viewer
         */
        function getBookmark() {
            return bookmarkService.getBookmark();
        }

        /**
         * Updates the map using bookmark. If initial is set, will only be used if its the first call to be received.
         *
         * @param {String} bookmark     The bookmark containing the desired state of the viewer
         */
        function useBookmark(bookmark) {
            reloadService.loadWithBookmark(bookmark, false);
        }

        /**
         * Updates the extent of the map.
         *
         * @param {Array}  x                    The x coord to center on
         * @param {Number} y                    The y coord to center on
         * @param {Object} spatialReference     The spatial Reference for the coordinates
         * @param {Number} zoom                 The level to zoom to
         */
        function centerAndZoom(x, y, spatialReference, zoom) {
            const zoomPoint = gapiService.gapi.proj.Point(x, y, spatialReference);

            // separate zoom and center calls, calling centerAndZoom sets the map to an extent made up of NaN
            geoService.mapObject.setZoom(zoom);
            geoService.mapObject.centerAt(zoomPoint);
        }
    }
})();
