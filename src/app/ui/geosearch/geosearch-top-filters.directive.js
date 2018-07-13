const templateUrl = require('./geosearch-top-filters.html');

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

function Controller(geosearchFiltersService) {
    'ngInject';
    const self = this;

    self.selectedProvince = null;
    self.selectedType = null;

    self.service = geosearchFiltersService;

    self.clear = clear;
    self.setType = setType;
    self.setProvince = setProvince;

    return;

    /**
     * Set province filter. Calls onUpdate function to notify the parent directive the filters have changed
     *
     * @function setProvince
     * @private
     */
    function setProvince() {
        self.service.setProvince(self.selectedProvince.name);
        self.onUpdate();

        // reset the selection like clear to unselect the option if -1
        if (self.selectedProvince.code === -1) {
            self.selectedProvince = null;
            self.service.setProvince(undefined);
        }
    }

    /**
     * Set type filter. Calls onUpdate function to notify the parent directive the filters have changed
     *
     * @function setType
     * @private
     */
    function setType() {
        self.service.setType(self.selectedType.name);
        self.onUpdate();

        // reset the selection like clear to unselect the option if -1
        if (self.selectedType.code === -1) {
            self.selectedType = null;
            self.service.setType(undefined);
        }
    }

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
