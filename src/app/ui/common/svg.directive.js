(() => {
    'use strict';

    // TODO: rename to rv-include

    /**
     * @ngdoc directive
     * @name rvSvg
     * @module app.ui.common
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
        .module('app.ui.common')
        .directive('rvSvg', rvSvg);

    function rvSvg() {
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
                        // for Safari, xlink:href element is named href. Rename the element xlink:href to show symbology
                        // it seems to be a bug from svg.js library
                        // TODO: send issue to svg library
                        if (typeof img.attr('href') !== 'undefined') {
                            scope.src = scope.src.replace('href', 'xlink:href');
                        }
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
})();
