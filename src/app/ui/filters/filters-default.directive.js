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

    function rvFiltersDefault() {
        var directive = {
            restrict: 'EA',
            templateUrl: 'app/ui/filters/filters-default.html',
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

    function Controller() {
        var self = this;
        self.message = 'Can you see me?';

        activate();

        function activate() {

        }
    }
})();
