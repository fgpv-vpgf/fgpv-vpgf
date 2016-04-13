(() => {
    'use strict';

    /**
     * @ngdoc function
     * @name runBlock
     * @module app.core
     * @description
     *
     * The `runBlock` triggers config and locale file loading, sets language of the app.
     */
    angular
        .module('app.core')
        .run(apiBlock)
        .run(runBlock);

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

        // to prevent FOUC need to load translation files with config initialization if we know the language
        // $rootScope.$on('$translateLoadingSuccess', data => console.log(data));
        $rootScope.$on('$translateLoadingSuccess', () => console.log(
            '$translateLoadingSuccess ->'));

        // TODO: write language detection routine
        $translate.use('en-CA');
    }

    function apiBlock($translate, $rootElement, $rootScope, $q, globalRegistry, geoService, configService, events) {
        const service = {
            setLanguage,
            loadRcsLayers
        };

        // Attaches a promise to the appRegistry which resolves with apiService
        const apiPromise = $q(resolve => {
            $rootScope.$on(events.rvReady, resolve(service));
            console.info('registered');
        });

        globalRegistry.appRegistry[$rootElement.attr('id')] = apiPromise;

        /**********************/

        /**
         * Sets the translation language and reloads the map
         *
         * @param {String}  lang    the language to switch to
         */
        function setLanguage(lang) {
            $translate.use(lang);
            geoService.assembleMap();
        }

        /**
         * Load RCS layers after the map has been instantiated
         *
         * @param {Array}  keys  array of RCS keys (String) to be added
         */
        function loadRcsLayers(keys) {

            // trigger RCS web call, insert into config
            configService.rcsAddKeys(keys).then(newLayerConfigs => {
                // call layer register in geo module on those nodes
                geoService.constructLayers(newLayerConfigs);
            });

        }
    }
})();
