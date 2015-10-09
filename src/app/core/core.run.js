(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name runBlock
     * @module app.core
     * @description
     *
     * The `runBlock` triggers config and locale file loading.
     */
    angular
        .module('app.core')
        .run(runBlock);

    /* @ngInject */
    function runBlock(configService, $rootScope, $translate) {
        // wait until config is retrieved
        configService.initialize()
            .then(function () {
                // initialize other services, if any
                console.log('Config initialized');
            });

        // to prevent FOUC need to load translation files with config initialization if we know the language
        $rootScope.$on('$translateLoadingSuccess', function (data) {
            console.log(data);
        });

        $translate.use('fr-CA');
    }

})();
