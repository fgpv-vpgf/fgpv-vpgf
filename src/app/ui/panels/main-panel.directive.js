(function () {
    'use strict';

    angular
        .module('app.ui.panels')
        .directive('rvMainPanel', rvMainPanel);

    function rvMainPanel() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/ui/panels/main-panel.html',
            scope: {},
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function linkFunc() { //(scope, el, attr, ctrl) {

        }
    }

    /* @ngInject */
    function Controller() {
        //var self = this;

        activate();

        function activate() {

        }
    }
})();
