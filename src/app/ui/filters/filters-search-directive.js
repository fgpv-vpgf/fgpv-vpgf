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

    function Controller(filterService, debounceService) {
        'ngInject';
        const self = this;

        self.searchText = '';
        self.search = debounceService.registerDebounce(search, 700, false);
        self.clear = clear;

        /**
         * Apply global search to the table.
         *
         * @function search
         */
        function search() {
            filterService.getTable().search(self.searchText).draw();
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
