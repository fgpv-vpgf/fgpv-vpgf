(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMapnav
     * @module app.ui.mapnav
     * @restrict E
     * @description
     *
     * The `rvMapnav` description handles the map navigation component.
     *
     */
    angular
        .module('app.ui.mapnav')
        .directive('rvMapnav', rvMapnav);

    function rvMapnav() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/mapnav/mapnav.html',
            scope: {
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link() { //scope, el, attr, ctrl) {

        }
    }

    function Controller(mapNavigationService) {
        'ngInject';
        const self = this;

        // expose navigation service to the template
        self.config = mapNavigationService.config;

        activate();

        ///////////

        function activate() {

        }
    }
})();
