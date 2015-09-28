(function () {
    'use strict';

    angular
        .module('app.ui.panels')
        .directive('rvSidePanel', rvSidePanel);

    function rvSidePanel() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/ui/panels/side-panel.html',
            scope: {},
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function linkFunc() { //scope, el, attr, ctrl) {

        }
    }

    /* @ngInject */
    function Controller() {
        //var vm = this;

        activate();

        function activate() {

        }
    }
})();
