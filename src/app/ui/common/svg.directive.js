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
     * -- src  svg code to render directly to the page
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
            }

            const stopWatch = scope.$watch('src', newValue => {
                if (newValue) {
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
