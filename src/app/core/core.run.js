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
    function runBlock($rootScope, $translate, $q, events, configService, gapiService) {
        const promises = [
            configService.initialize(),
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
        LayerBlueprint) {
        const service = {
            setLanguage,
            loadRcsLayers
        };

        // Attaches a promise to the appRegistry which resolves with apiService
        $rootScope.$on(events.rvReady, () => {
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
    }
})();
