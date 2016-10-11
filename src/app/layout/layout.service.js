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

    function layoutService(sideNavigationService, mapNavigationService, $rootElement) {

        const service = {
            currentLayout,
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

        /**
        * Determines the current layout type as either small, medium, or large depending on the width of the $rootElement
        * @function  currentLayout
        * @return  {String} either 'small', 'medium', or 'large'
        */
        function currentLayout() {
            if ($rootElement.width() <= 480) {
                return 'small';
            } else if ($rootElement.width() <= 840) {
                return 'medium';
            } else {
                return 'large';
            }
        }

    }
})();
