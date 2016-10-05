(() => {
    'use strict';

    /**
     * @module rvGeosearchFilters
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvGeosearchFilters` directive to set filters for geolocation search.
     *
     */
    angular
        .module('app.ui.geosearch')
        .directive('rvGeosearchFilters', rvGeosearchFilters);

    /**
     * `rvGeosearchFilters` directive body.
     *
     * @function rvGeosearchFilters
     * @return {object} directive body
     */
    function rvGeosearchFilters() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/geosearch/geosearch-filters.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(geosearchService) {
        'ngInject';
        const self = this;

        self.geosearchService = geosearchService;
        self.filters = geosearchService.filters;
    }
})();
