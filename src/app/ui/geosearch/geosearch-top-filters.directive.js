(() => {
    'use strict';

    /**
     * @module rvGeosearchTopFilters
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvGeosearchTopFilters` directive to set filters such as Province and Type.
     *
     */
    angular
        .module('app.ui')
        .directive('rvGeosearchTopFilters', rvGeosearchTopFilters);

    /**
     * `rvGeosearchTopFilters` directive body.
     *
     * @function rvGeosearchTopFilters
     * @return {object} directive body
     */
    function rvGeosearchTopFilters() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/geosearch/geosearch-top-filters.html',
            scope: {
                onUpdate: '='
            },
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(geosearchFiltersService) {
        'ngInject';
        const self = this;

        self.selectedProvince = null;
        self.selectedType = null;

        self.service = geosearchFiltersService;

        self.clear = clear;

        return;

        /**
         * Clears all filters. Calls onUpdate function to notify the parent directive the filters have changed
         *
         * @function clear
         * @private
         */
        function clear() {
            self.selectedProvince = null;
            self.selectedType = null;

            self.service.setProvince(undefined);
            self.service.setType(undefined);

            self.onUpdate();
        }
    }
})();
