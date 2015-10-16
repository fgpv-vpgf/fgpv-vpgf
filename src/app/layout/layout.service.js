(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name layoutService
     * @module app.layout
     *
     * @description
     * The `layoutService` service works as a UI-manager for the rest of the application. `layoutService` exposes services for individual components that can be called.
     */
    angular
        .module('app.layout')
        .factory('layoutService', layoutService);

    /* @ngInject */
    function layoutService(sideNavigationService, mapNavigationService) {
        var service = {
            sidenav: sideNavigationService,
            mapnav: mapNavigationService
        };

        return service;

    }
})();
