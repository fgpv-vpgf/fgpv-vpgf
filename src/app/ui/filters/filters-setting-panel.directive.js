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
        });

        self.reorder = onReorder;
        self.sort = onSort;
        self.display = onDisplay;

        /**
         * On drag click to reorder the column
         *
         * @function onReorder
         * @param   {String}   column   column name
         */
        function onReorder(column) {
            // use same approach as https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1457
            console.log(`dragClick ${column.name}`);
        }

        /**
         * On sort click to sort the column
         *
         * @function onDrag
         * @param   {String}   column   column name
         */
        function onSort(column) {
            column.sort = 'up';
            console.log(`sortClick ${column.isSorted}`);
        }

        /**
         * On display click to show/hide column
         *
         * @function onDisplay
         * @param   {String}   column   column name
         */
        function onDisplay(column) {
            console.log(`displayClick ${column.display}`);
        }
    }
})();
