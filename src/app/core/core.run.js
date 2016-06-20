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
    function runBlock($rootScope, $rootElement, $translate, $q, events, configService, gapiService,
            bookmarkService) {

        const promises = [
            configService.initialize()
                .then(config => bookmarkCallback(config)),
            gapiService.isReady
        ];

        // wait on the config and geoapi
        $q.all(promises)
            .then(() => {
                // initialize other services, if any
                console.log('Config initialized');
                $rootScope.$broadcast(events.rvReady);
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

        function bookmarkCallback(config) {
        const bookmarkAttr = $rootElement.attr('rv-restore-bookmark');

        if (bookmarkAttr) {
            const namespaces = bookmarkAttr.split('.');
            let context = window;
            namespaces.forEach(scope => {
                try {
                    context = context[scope];
                } catch (e) {
                    // No need for an error, this just means we use the bookmarkAttr as a bookmark string
                }
            });
            if (typeof context === 'function') {
                context().then(bookmark => {
                    return bookmarkService.parseBookmark(bookmark, config);
                });
            } else {
                return bookmarkService.parseBookmark(bookmarkAttr, config);
            }
        } else {
            return config;
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
    function apiBlock($translate, $rootElement, $rootScope, globalRegistry, geoService, configService, events,
        LayerBlueprint, bookmarkService, gapiService) {
        const service = {
            setLanguage,
            loadRcsLayers,
            getBookmark,
            centerAndZoom
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
            $translate.use(lang);
            geoService.assembleMap();
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
                        new LayerBlueprint.service(layerConfig));
                    geoService.constructLayers(layerBlueprints);
                });

        }

        function getBookmark() {
            return bookmarkService.getBookmark();
        }

        function centerAndZoom(x, y, spatialReference, zoom) {
            const zoomPoint = gapiService.gapi.proj.Point(x, y, spatialReference);

            // separate zoom and center calls, calling centerAndZoom sets the map to an extent made up of NaN
            geoService.mapObject.setZoom(zoom);
            geoService.mapObject.centerAt(zoomPoint);
        }
    }
})();
