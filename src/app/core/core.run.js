(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name app.core#runBlock
     * @module app.core
     * @description
     *
     * The `runBlock` triggers config and locale file loading.
     */
    angular
        .module('app.core')
        .run(runBlock);

    /* @ngInject */
    /**
     * The `runBlock` initializes the `configService` and sets language of the app.
     *
     * @param  {object} configService
     * @param  {object} $rootScope
     * @param  {object} $translate
     */
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

        // TODO: write language detection routine
        $translate.use('fr-CA');
    }

})();
