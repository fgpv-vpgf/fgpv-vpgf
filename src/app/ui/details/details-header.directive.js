const templateUrl = require('./details-header.html');

/**
 * @module rvDetailsHeader
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvDetailsHeader` directive provides a custom header for details panel.
 *
 */
angular
    .module('app.ui')
    .directive('rvDetailsHeader', rvDetailsHeader);

/**
 * `rvDetailsHeader` directive body.
 *
 * @function rvDetailsHeader
 * @return {object} directive body
 */
function rvDetailsHeader() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            headerTitle: '=',
            selectedItem: '='
        },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(detailService) {
    'ngInject';
    const self = this;

    self.expandPanel = detailService.expandPanel;
    self.closeDetails = detailService.closeDetails;
}
