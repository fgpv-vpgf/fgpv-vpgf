(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvFiltersDefault
     * @module app.ui.filters
     * @description
     *
     * The `rvFiltersDefault` directive is a filters and datatable panel component.
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersDefault', rvFiltersDefault);

    /* @ngInject */
    /**
     * `rvFiltersDefault` directive body.
     *
     * @return {object} directive body
     */
    function rvFiltersDefault() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-default.html',
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
        function linkFunc() { //scope, el, attr, ctrl) {

        }
    }

    /* @ngInject */
    /**
     * Sceleton controller function with test message.
     */
    function Controller() {
        var self = this;
        self.message = 'Can you see me?';

        activate();

        function activate() {

        }
    }
})();
