(() => {
    'use strict';

    /**
     * @module rvFiltersSettingPanel
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvFiltersSettingPanel` directive for a filters setting panel.
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersSettingPanel', rvFiltersSettingPanel);

    /**
     * `rvFiltersSettingPanel` directive body.
     *
     * @function rvFiltersSettingPanel
     * @return {object} directive body
     */
    function rvFiltersSettingPanel() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-setting-panel.html',
            scope: { },
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($scope, events, filterService, stateManager) {
        'ngInject';
        const self = this;

        $scope.$on(events.rvTableReady, () => {
            self.columns = stateManager.display.filters.data.columns;
            $scope.columns = self.columns;

            init();
        });

        self.reorder = onReorder;
        self.sort = onSort;
        self.display = onDisplay;
        self.filterService = filterService;

        /**
         * On table load, initialize sort and display for all columns
         *
         * @function init
         */
        function init() {
            sortColumns();

            // toggle the visibility
            self.columns.forEach((column) => {
                if (!column.display) {
                    self.filterService.getTable().column(`${column.name}:name`).visible(false);
                }
            });
        }

        /**
         * Sort table from array of sort values (all columns)
         *
         * @function sortColumns
         */
        function sortColumns() {
            // create array of sort from columns
            const sorts = [];
            self.columns.forEach((column, i) => {
                if (typeof column.sort !== 'undefined' && column.sort !== 'none') {
                    sorts.push([i, column.sort]);
                }
            });

            // sort columns
            const table = self.filterService.getTable();
            if (sorts.length) {
                table.order(sorts).draw();
            }
        }

        /**
         * On drag click to reorder the column
         *
         * @function onReorder
         * @param   {Object}   columnInfo   column information
         */
        function onReorder(columnInfo) {
            // use same approach as https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1457
            console.log(`dragClick ${columnInfo.name}`);
        }

        /**
         * On sort click, apply sort value to the column then sort the table
         *
         * @function onSort
         * @param   {Object}   columnInfo   column information
         */
        function onSort(columnInfo) {
            // set sort value on actual column
            const sort = (columnInfo.sort === 'none') ? 'asc' : ((columnInfo.sort === 'asc') ?
                'desc' : 'none');
            columnInfo.sort = sort;

            // sort the table
            sortColumns();
        }

        /**
         * On display click, show/hide the column
         *
         * @function onDisplay
         * @param   {Object}   columnInfo   column information
         */
        function onDisplay(columnInfo) {
            // get column
            const column = self.filterService.getTable().column(`${columnInfo.name}:name`);

            // toggle the visibility
            column.visible(columnInfo.display);
        }
    }
})();
