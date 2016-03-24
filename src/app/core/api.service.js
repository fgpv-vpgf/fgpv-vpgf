(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name apiService
     * @module app.core
     * @description
     *
     * The `apiService` service allows individual apps to expose functions to the global registry.
     *
     */
    angular
        .module('app.core')
        .factory('apiService', apiService);

    function apiService($translate, $rootElement, $rootScope, $q, globalRegistry, geoService,  events) {
        'ngInject';
        const service = {
            setLanguage
        };

        init();

        return service;

        /**********************/

        function setLanguage(lang) {
            $translate.use(lang);
            geoService.assembleMap();
        }

        function init() {
            const apiPromise = $q((resolve) => {
                $rootScope.$on(events.rvReady, resolve(service));
                console.info('registered');
            });

            globalRegistry.appRegistry[$rootElement.attr('id')] = apiPromise;
        }
    }
})();
