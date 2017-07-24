const templateUrl = require('./default-menu.html');

/**
 * @module rvTableDefaultMenu
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvTableDefaultMenu` directive is a data panel menu allowing the user to change the layout of the data panel between 'full', 'default', and 'minimized', toggling search and table controls and pringting or exporting data from the table.
 *
 */
angular
    .module('app.ui')
    .directive('rvTableDefaultMenu', rvTableDefaultMenu);

function rvTableDefaultMenu(layoutService) {
    const directive = {
        restrict: 'E',
        templateUrl,
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

function Controller($scope, stateManager, events, tableService, appInfo, $rootScope, layoutService) {
    'ngInject';
    const self = this;

    self.setMode = setMode;
    self.tableMode = stateManager.state.table.morph;
    self.applyFilter = tableService.setActive; // use by filter by extent
    self.filter = tableService.filter;
    self.showFilters = showFilters;
    self.dataPrint = dataPrint;
    self.dataExportCSV = dataExportCSV;
    self.appID = appInfo.id;

    // check if filter size is modified from outside this directive and apply the filter mode. This can happen if config table wants the panel maximize on open.
    $rootScope.$watch(() => stateManager.state.table.morph, val => { self.tableMode = val });

    function showFilters() {
        stateManager.display.table.data.filter.isOpen = self.filter.isOpen;
        layoutService.isFiltersVisible = stateManager.display.table.data.filter.isOpen;
    }

    function setMode(mode) {
        const requester = stateManager.display.table.requester;
        const config = requester.legendEntry._mainProxyWrapper.layerConfig.table;
        stateManager.setMorph('table', mode);
        if (mode === 'full') {
            config.maximize = true;
        } else {
            config.maximize = false;
        }
    }

    /**
     * Emits a data print event.
     * @function dataPrint
     * TODO: eschew events; needed here since it's very hard to communicate with main table directive; angular 1.5 should solve it using directives with multiple transclusions
     */
    function dataPrint() {
        $scope.$emit(events.rvDataPrint);
    }

    /**
     * Emits a data expor csv event.
     * @function dataExportCSV
     * TODO: eschew events; needed here since it's very hard to communicate with main table directive; angular 1.5 should solve it using directives with multiple transclusions
     */
    function dataExportCSV() {
        $scope.$emit(events.rvDataExportCSV);
    }
}
