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
                    // jscs:disable maximumLineLength

                    const img = angular.element(scope.src).find('image');
                    if (img.length === 1) {
                        let href = img.attr('href');
                        let xlinkhref = img.attr('xlink:href');

                        if (typeof href === 'undefined') {
                            href = xlinkhref;
                        }

                        // while (href.length % 4 > 0) {
                        //     href += '=';
                        // }

                        // works
                        // el.empty().append(`<svg id="SvgjsSvg1281" width="32" height="32" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" viewBox="0 0 32 32"><defs id="SvgjsDefs1282"></defs><image height="${img.attr('height')}" width="${img.attr('width')}" xlink:href="${href}"></image></svg>`);


                        // el.empty().append(`<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        //                       <image xlink:href="circle_thin1600.png" x="0" y="0" height="100" width="100"></image>
                        //                     </svg>`);

                        scope.src = scope.src.substring(0, scope.src.indexOf('xlink:href')) + 'href="' + href + '" ' + scope.src.substring(scope.src.lastIndexOf('width'));
                        el.empty().append(scope.src);

                    } else {
                        el.empty().append(scope.src);
                    }

                    // do not watch for updates to src anymore
                    if (attr.once) {
                        stopWatch();
                    }

                    // jscs:enable maximumLineLength
                }
            });
        }
    }
})();
