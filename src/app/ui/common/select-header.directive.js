const templateUrl = require('./select-header.html');

/**
 * This is a dumb wrapper around `md-select-header` component to avoid `can only have one , or <md-select> child element!"` error on `md-input-container`.
 *
 * @module rvSelectHeader
 * @memberof app.ui
 * @restrict E
 * @description
 *
 */
angular
    .module('app.ui')
    .directive('rvSelectHeader', rvSelectHeader);

function rvSelectHeader() {
    const directive = {
        restrict: 'E',
        templateUrl,
        transclude: true
    };

    return directive;
}
