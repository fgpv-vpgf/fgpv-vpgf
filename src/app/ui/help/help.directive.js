/**
 * @module rvHelp
 * @module app.ui
 * @restrict E
 * @description
 *
 * The `rvHelp` directive marks what items are highlighted on the help screen
 *
 */
angular
    .module('app.ui')
    .directive('rvHelp', rvHelp);

function rvHelp(helpService) {
    const directive = {
        restrict: 'A',
        scope: false,
        link: link
    };

    return directive;

    /*********/

    function link(scope, element, attr) { // , ctrl) {
        const obj = { getCoords: getCoords, key: attr.rvHelp.toString() };
        helpService.register(obj);

        function getCoords() {
            const offset = element.offset();
            let result;

            // if the element is invisible give dummy dimensions
            if (!element.is(':visible')) {
                result = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
            } else {
                result = {
                    // dont need to account for padding
                    x: offset.left - parseInt(element.css('margin-left')) - parseInt(element.css('border-left')),
                    y: offset.top - parseInt(element.css('margin-top')) - parseInt(element.css('border-top')),
                    width: element.outerWidth(true),
                    height: element.outerHeight(true)
                };
            }

            return result;
        }

        scope.$on('$destroy', () => {
            helpService.unregister(obj);
        });
    }
}
