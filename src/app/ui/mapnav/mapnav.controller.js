(function () {
    'use strict';

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

    /* @ngInject */
    /**
     * `MapNavigationController` directive body.
     *
     * @param {object} mapNavigationService
     */
    function MapNavigationController(mapNavigationService) {
        var self = this;

        // expose navigation service to the template
        self.service = mapNavigationService;

        activate();

        function activate() {

        }
    }
})();
