(() => {
    'use strict';

    /**
     * @module rvFiltersSettingCluster
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvFiltersSettingCluster` directive for filters buttons cluster action (apply to map, clear filters and toggle setting panel).
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersSettingCluster', rvFiltersSettingCluster);

    /**
     * `rvFiltersSettingCluster` directive body.
     *
     * @function rvFiltersSettingCluster
     * @return {object} directive body
     */
    function rvFiltersSettingCluster() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-setting-cluster.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(filterService) {
        'ngInject';
        const self = this;

        self.filterService = filterService;
    }
})();
