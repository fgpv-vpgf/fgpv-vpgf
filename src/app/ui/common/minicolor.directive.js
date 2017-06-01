import '@claviska/jquery-minicolors';
import nameToHex from './names-to-hex.js';

/**
 * @name rvMinicolors
 * @module app.ui
 * @restrict E
 * @description
 *
 * Directive wrapper for jQuery MiniColors.
 *
 */
angular
    .module('app.ui')
    .directive('rvMinicolors', rvMinicolors);

function rvMinicolors(graphicsService, $timeout) {
    const directive = {
        require: 'ngModel',
        restrict: 'A',
        scope: { 'options': '=' },
        link
    };

    return directive;

    function link(scope, el, attrbs, ngModel) {
        el.minicolors(scope.options);
        el.on('blur', onBlur);

        ngModel.$render = function () {
            const color = ngModel.$viewValue;
            el.minicolors('value', color);
        };

        function onBlur(e) {
            let color = ngModel.$viewValue;

            // check that the input is not / does not contain a hexadecimal value
            if (color && !/\b([0-9A-F]{6}$)\b|\b([0-9A-F]{3}$)\b/i.test(color)) {

                // remove any whitespace in color name
                color = color.replace(/\s+/g, '');
                color = nameToHex(color);
            }

            // ensure the color has a hash symbol at the start
            if (color.charAt(0) !== '#')    color = '#' + color;

            ngModel.$setViewValue(color);
            ngModel.$render();
        }
    }
}
