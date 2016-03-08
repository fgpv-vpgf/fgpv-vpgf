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
        .run(runBlock);

    function runBlock($rootScope, $translate, $q, events, configService, gapiService, mapService, geoService) {
        const promises = [
            gapiService.ready(),
            configService.initialize(),
            mapService.isReady
        ];

        // wait on the config and geoapi
        $q.all(promises)
            .then(() => {
                // initialize other services, if any
                console.log('Config initialized');
                $rootScope.$broadcast(events.rvReady);
                geoService.buildMap();
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
})();
