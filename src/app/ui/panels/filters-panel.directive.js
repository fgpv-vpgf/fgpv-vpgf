(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvFiltersPanel
     * @module app.ui.panels
     * @description
     *
     * The `rvFiltersPanel` directive is a outer panel container with a content plug view to allow for different content to be displayed.
     */
    angular
        .module('app.ui.panels')
        .directive('rvFiltersPanel', rvFiltersPanel);

    /* @ngInject */
    /**
     * `rvFiltersPanel` directive body.
     *
     * @return {object} directive body
     */
    function rvFiltersPanel() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/panels/filters-panel.html',
            scope: {},
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Skeleton link function.
         */
        function linkFunc() { //(scope, el, attr, ctrl) {

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
