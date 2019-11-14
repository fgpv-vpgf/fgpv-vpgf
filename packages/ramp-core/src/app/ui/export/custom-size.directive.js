const templateUrl = require('./custom-size.html');

/**
 * @module rvExportCustomSize
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * This directive contains the html template for setting a custom width and height for the
 * export image. It sets focus on the first input (width) whenever it is created.
 */
angular
    .module('app.ui')
    .directive('rvExportCustomSize', rvExportCustomSize);

function rvExportCustomSize() {
    return {
        restrict: 'E',
        templateUrl,
        link: (scope, el) => el.find('input').first().rvFocus({ delay: 400 })
    };
}
