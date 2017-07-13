/**
 * @module rvTableNumberOnly
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvTableNumberOnly` directive is use to enforce numbers input tag (http://codepen.io/apuchkov/pen/ILjFr).
 */
angular
    .module('app.ui')
    .directive('rvTableNumberOnly', rvTableNumberOnly);

function rvTableNumberOnly() {
    return {
        require: 'ngModel',
        link: (scope, element, attr, ngModelCtrl) => {
            function fromUser(text) {
                if (text) {
                    const numRegex = /-?(\d+)?(\.)?(\d+)?/g;
                    const transformedInput = text.match(numRegex);

                    if (transformedInput !== null) {
                        ngModelCtrl.$setViewValue(transformedInput[0]);
                    } else {
                        ngModelCtrl.$setViewValue(text.slice(0, -1));
                    }
                    ngModelCtrl.$render();

                    return transformedInput[0];
                }
                return '';
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
}
