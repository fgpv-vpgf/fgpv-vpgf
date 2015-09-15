(function () {
    'use strict';

    angular
        .module('app.layout')
        .factory('layoutService', layoutService);

    /**
     * @ngdoc service
     * @name layoutService
     * @module app.layout
     *
     * @description
     * `layoutService` works as a UI-manager for the rest of the application.
     *
     * @usage
     * `layoutService` exposes services for individual components that can be called.
     *
     */
    /* @ngInject */
    function layoutService(sideNavigationService) {
        var service = {
            sidenav: sideNavigationService
        };

        return service;

    }
})();
