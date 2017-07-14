const templateUrl = require('./setting-cluster.html');

/**
 * @module rvTableSettingCluster
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvTableSettingCluster` directive for table buttons cluster action (apply to map, clear filters and toggle setting panel).
 *
 */
angular
    .module('app.ui')
    .directive('rvTableSettingCluster', rvTableSettingCluster);

/**
 * `rvTableSettingCluster` directive body.
 *
 * @function rvTableSettingCluster
 * @return {object} directive body
 */
function rvTableSettingCluster() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(tableService) {
    'ngInject';
    const self = this;

    self.tableService = tableService;
}
