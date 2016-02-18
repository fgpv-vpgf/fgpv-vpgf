(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvFiltersDefaultMenu
     * @module app.ui.filters
     * @restrict E
     * @description
     *
     * The `rvFiltersDefaultMenu` directive is a data panel menu allowing the user to change the layout of the data panel between 'full', 'default', and 'minimized', toggling search and filters controls and pringting or exporting data from the table.
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersDefaultMenu', rvFiltersDefaultMenu);

    function rvFiltersDefaultMenu() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-default-menu.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link() { // scope, el, attr, ctrl) {

        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.setMode = setMode;

        self.filtersMode = filtersMode;

        activate();

        /*********/

        function activate() {

        }

        function setMode(mode) {
            stateManager.setMorph('filters', mode);
        }

        function filtersMode() {
            return stateManager.state.filters.morph;
        }
    }
})();
