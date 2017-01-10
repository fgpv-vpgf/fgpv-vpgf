(() => {
    'use strict';

    /**
     * @module rvFiltersSearch
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvFiltersSearch` directive let user enter text for a global search.
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersSearch', rvFiltersSearch);

    /**
     * `rvFiltersSearch` directive body.
     *
     * @function rvFiltersSearch
     * @return {object} directive body
     */
    function rvFiltersSearch() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-search.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(filterService, debounceService, $timeout, $rootElement, stateManager, $rootScope, events) {
        'ngInject';
        const self = this;

        self.searchText = '';
        self.search = debounceService.registerDebounce(search, 700, false);
        self.clear = clear;

        $rootScope.$on(events.rvTableReady, () => {
            // set global search from saved state
            self.searchText = stateManager.display.filters.data.filter.globalSearch;
        });

        /**
         * Apply global search to the table.
         *
         * @function search
         */
        function search() {
            // show processing
            $rootElement.find('.dataTables_processing').css('display', 'block');

            // redraw table with search parameter (use timeout for redraw so processing can show)
            $timeout(() => { filterService.getTable().search(self.searchText).draw(); }, 100);

            // keep global search value for this table
            stateManager.display.filters.data.filter.globalSearch = self.searchText;
        }

        /**
         * Clear global search for the table.
         *
         * @function clear
         */
        function clear() {
            self.searchText = '';
            search();
        }
    }
})();
