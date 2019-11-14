const templateUrl = require('./geosearch-bottom-filters.html');

/**
 * @module rvGeosearchBottomFilters
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvGeosearchBottomFilters` directive handles 'show only results from the current extent' filter.
 *
 */
angular
    .module('app.ui')
    .directive('rvGeosearchBottomFilters', rvGeosearchBottomFilters);

/**
 * `rvGeosearchBottomFilters` directive body.
 *
 * @function rvGeosearchBottomFilters
 * @return {object} directive body
 */
function rvGeosearchBottomFilters() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            onUpdate: '='
        },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(geosearchFiltersService, debounceService) {
    'ngInject';
    const self = this;

    self.visibleOnly = false;

    self.service = geosearchFiltersService;

    self.onUpdateDebounce = onUpdateDebounceBuilder();

    return;

    /***/

    /**
     * Updates geosearchFilterService value and call onUpdate function provided through the scope.
     *
     * @function onUpdateDebounceBuilder
     * @private
     * @return {Function} debounced onUpdate function
     */
    function onUpdateDebounceBuilder() {
        return debounceService.registerDebounce(() => {

            self.service.setVisible(self.visibleOnly);
            self.onUpdate(self.visibleOnly);
        }, 300, false);
    }
}
