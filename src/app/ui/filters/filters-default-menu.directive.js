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

    function rvFiltersDefaultMenu(layoutService) {
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

        function link(scope) {
            const self = scope.self;
            self.currentLayout = layoutService.currentLayout;
        }
    }

    function Controller($scope, stateManager, events, filterService, appInfo, $rootScope, layoutService) {
        'ngInject';
        const self = this;

        self.setMode = setMode;
        self.filtersMode = stateManager.state.filters.morph;
        self.applyFilter = filterService.setActive;
        self.filter = filterService.filter;
        self.isShowFilters = (layoutService.currentLayout() === 'large') ? true : false;
        self.showFilters = showFilters;
        self.dataPrint = dataPrint;
        self.dataExportCSV = dataExportCSV;
        self.appID = appInfo.id;

        // check if filter size is modified from outside this directive and apply the filter mode. This can happen if config filters wants the panel maximize on open.
        $rootScope.$watch(() => stateManager.state.filters.morph, val => self.filtersMode = val);

        function showFilters() {
            $rootScope.isFiltersVisible = self.filter.isOpen;
        }

        function setMode(mode) {
            stateManager.setMorph('filters', mode);
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
