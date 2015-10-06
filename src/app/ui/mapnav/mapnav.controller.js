(function () {
    'use strict';

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
