(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvSidePanel
     * @module app.ui.panels
     * @description
     *
     * The `rvSidePanel` directive is an side panel outter container with a content plug view to allow for different content to be displayed.
     */
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
