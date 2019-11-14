// TODO: rename to rv-include

/**
 *
 * @name rvSvg
 * @module app.ui
 * @restrict E
 * @description
 *
 * The `rvSvg` directive renders supplied svg code to the page.
 * -- src  svg code or svg node to render directly to the page
 * -- once {default: true} if set, works as one-time binding (svg will not be updated if the corresponding value changes)
 *
 * This can be used to include all sort of things: strings, jQuery nodes, (potentially) DOM nodes, etc.
 *
 */
angular
    .module('app.ui')
    .directive('rvSvg', rvSvg);

function rvSvg(graphicsService) {
    const directive = {
        restrict: 'E',
        scope: {
            src: '='
        },
        link: link
    };

    return directive;

    /***/

    function link(scope, el, attr) {
        if (typeof attr.once === 'undefined') {
            attr.once = true;
        } else {
            attr.once = attr.once.toLowerCase() !== 'false'; // any other value apart from "false" will be considered as true
        }

        const stopWatch = scope.$watch('src', newValue => {
            if (newValue) {
                // check if this is a svg node and if it contain an image. If so, we need to modify the href element (for Safari)
                const node = angular.element(scope.src);
                const img = node.find('image');
                if (node.is('svg') && img.length > 0) {
                    // for Safari, rename the element xlink:href to show symbology
                    scope.src = graphicsService.setSvgHref(scope.src);
                }

                el.empty().append(scope.src);

                // do not watch for updates to src anymore
                if (attr.once) {
                    stopWatch();
                }
            }
        });
    }
}
