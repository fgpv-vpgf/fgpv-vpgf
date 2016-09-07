(() => {
    'use strict';

    /**
     * @module rvFiltersDefaultMenu
     * @memberof app.ui
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

    function Controller($scope, stateManager, events, focusService, filterService) {
        'ngInject';
        const self = this;

        self.setMode = setMode;
        self.filtersMode = stateManager.state.filters.morph;
        self.applyFilter = filterService.setActive;
        self.filter = filterService.filter;
        self.dataPrint = dataPrint;
        self.dataExportCSV = dataExportCSV;

        function setMode(mode) {
            stateManager.setMorph('filters', mode);
            focusService.setPanelFocus('filters');
        }

        /**
         * Emits a data print event.
         * @function dataPrint
         * TODO: eschew events; needed here since it's very hard to communicate with main filters directive; angular 1.5 should solve it using directives with multiple transclusions
         */
        function dataPrint() {
            $scope.$emit(events.rvDataPrint);
        }

        /**
         * Emits a data expor csv event.
         * @function dataExportCSV
         * TODO: eschew events; needed here since it's very hard to communicate with main filters directive; angular 1.5 should solve it using directives with multiple transclusions
         */
        function dataExportCSV() {
            $scope.$emit(events.rvDataExportCSV);
        }
    }
})();
