(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvBasemap
     * @module app.ui.basemap
     * @restrict E
     * @description
     *
     * The `rvBasemap` directive description.
     *
     */
    angular
        .module('app.ui.basemap')
        .directive('rvBasemap', rvBasemap);

    function rvBasemap() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/basemap/basemap.html',
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

    function Controller() {
        //const self = this;

        activate();

        ///////////

        function activate() {

        }
    }
})();
