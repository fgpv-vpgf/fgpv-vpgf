(() => {

    /**
     * @ngdoc function
     * @name MapNavigationController
     * @module app.ui.mapnav
     * @description
     *
     * The `MapNavigationController` controller handles the map navigation component.
     */
    angular
        .module('app.ui.mapnav')
        .controller('MapNavigationController', MapNavigationController);

    /**
     * `MapNavigationController` directive body.
     *
     * @param {object} mapNavigationService
     */
    function MapNavigationController(mapNavigationService) {
        const self = this;

        // expose navigation service to the template
        self.service = mapNavigationService;

        activate();

        function activate() {

        }
    }
})();
