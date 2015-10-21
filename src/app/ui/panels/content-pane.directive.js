(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvContentPane
     * @module app.ui.panels
     * @description
     *
     * The `rvContentPane` directive is a panel inner container holding the panel's content.
     *
     */
    angular
        .module('app.ui.panels')
        .directive('rvContentPane', rvContentPane);

    /* @ngInject */
    /**
     * `rvContentPane` directive body.
     *
     * @return {object} directive body
     */
    function rvContentPane() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/panels/content-pane.html',
            scope: {
                title: '@', // binds to the evaluated dom property
                titleStyle: '@'
            },
            transclude: true,
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Skeleton link function.
         */
        function linkFunc() { // scope, el, attr, ctrl ) {

        }
    }

    /* @ngInject */
    /**
     * Skeleton controller function.
     */
    function Controller() {

        //var self = this;

        activate();

        function activate() {

        }
    }
})();
