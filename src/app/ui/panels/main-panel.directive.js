(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMainPanel
     * @module app.ui.panels
     * @description
     *
     * The `rvMainPanel` directive is a outter panel container with a content plug view to allow for different content to be displayed.
     */
    angular
        .module('app.ui.panels')
        .directive('rvMainPanel', rvMainPanel);

    /* @ngInject */
    /**
     * `rvMainPanel` directive body.
     * @return {object} directive body
     */
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

        /**
         * Sceleton link function.
         */
        function linkFunc() { //(scope, el, attr, ctrl) {

        }
    }

    /* @ngInject */
    /**
     * Sceleton controller function.
     */
    function Controller() {
        //var self = this;

        activate();

        function activate() {

        }
    }
})();
