(() => {

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

    function layoutService(sideNavigationService, mapNavigationService) {
        const service = {
            sidenav: sideNavigationService,
            mapnav: mapNavigationService,
            panels: {}
        };

        return service;

    }
})();
