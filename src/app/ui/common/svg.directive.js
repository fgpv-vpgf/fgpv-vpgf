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
                    const node = angular.element(scope.src);
                    const img = node.find('image');
                    if (img.length === 1) {
                        // get the href value from href (Safari) or xlink:href for the other browsers
                        const href = (typeof img.attr('href') === 'undefined') ?
                            img.attr('xlink:href') : img.attr('href');

                        // reset href element because it is not well populated for Safari
                        // it seems to be a bug from svg.js library
                        // TODO: send issue to svg library
                        node.find('image')[0].setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
                        el.empty().append(node);
                    } else {
                        el.empty().append(scope.src);
                    }

                    // do not watch for updates to src anymore
                    if (attr.once) {
                        stopWatch();
                    }
                }
            });
        }
    }
})();
