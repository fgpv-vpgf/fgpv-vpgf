import 'script-loader!@claviska/jquery-minicolors';
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

function rvMinicolors(graphicsService) {
    const directive = {
        require: 'ngModel',
        restrict: 'A',
        scope: { options: '=' },
        link
    };

    return directive;

    function link(scope, el, attrbs, ngModel) {
        el.minicolors(angular.extend(scope.options, {
            hideSpeed: 0,
            showSpeed: 0
        }));

        el.on('focus', onFocus);
        el.on('blur', onBlur);
        el.on('keyup', onKeyUp);

        // set initial value of color preview panel
        ngModel.$render = () => {
            const color = ngModel.$viewValue;
            el.minicolors('value', color);
        };

        function onFocus() {
            el.minicolors('hide');
        }

        function onBlur() {
            let color = ngModel.$viewValue;
            color = _colorHex(color);

            /*
                need to use ngModel to set the view value because of inconsistency with minicolors replacing
                first character to a '0' 
            */
            ngModel.$setViewValue(color);
            ngModel.$render();
        }

        function onKeyUp() {
            let color = ngModel.$viewValue;
            color = _colorHex(color);
            el.siblings().filter('.minicolors-swatch').css('background-color', color);
        }

        function _colorHex(color) {

            // remove any whitespace in color name
            color = color.replace(/\s/g, '');

            // check that the input is not / does not contain a hexadecimal value
            if (color && !/\b([0-9A-F]{6}$)\b|\b([0-9A-F]{3}$)\b/i.test(color)) {
                color = nameToHex(color);
            }

            // ensure the color has a hash symbol at the start
            if (color && color.charAt(0) !== '#') {
                color = '#' + color;
            }

            return color;
        }
    }
}
