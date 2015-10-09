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
    function MapNavigationController(mapNavigationService) {
        var self = this;

        self.service = mapNavigationService;

        activate();

        function activate() {

        }
    }
})();
