(() => {

    /**
     * @module layoutService
     * @memberof app.layout
     *
     * @description
     * The `layoutService` service works as a UI-manager for the rest of the application. `layoutService` exposes services for individual components that can be called.
     */
    angular
        .module('app.layout')
        .factory('layoutService', layoutService);

    function layoutService(sideNavigationService, mapNavigationService) {
        const service = {
            /**
             * Exposes sideNavigationSerivce
             * @member sidenav
             * @see sideNavigationSerivce
             */
            sidenav: sideNavigationService,
            /**
             * Exposes mapNavigationService
             * @member mapnav
             * @see mapNavigationService
             */
            mapnav: mapNavigationService,
            // FIXME explain how the two members below are different from those in storageService
            panels: {},
            panes: {} // registry for content pane nodes
        };

        return service;

    }
})();
