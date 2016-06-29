(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvTruncate
     * @module app.ui.common
     * @restrict E
     * @description
     *
     * The `rvTruncate` directive shortens the contents to a set limit as defined by the
     * `maxTextLength` property. If the maxTextLength is reached mid-word, the entire word is truncated instead.
     * If maxTextLength is not defined or less than 1 this directive has no effect.
     *
     * <rv-truncate max-text-length="7">Some text to shorten</rv-truncate>
     * Results in `Some...`
     */
    angular
        .module('app.ui.common')
        .directive('rvTruncate', rvTruncate);

    /**
     * `rvTruncate` directive body.
     *
     * @return {object} directive body
     */
    function rvTruncate($compile, $translate) {
        const directive = {
            restrict: 'E',
            scope: {
                maxTextLength: '@'
            },
            link
        };

        return directive;

        function link(scope, el, attr) {
            attr.$observe('maxTextLength', function (maxTextLength) {
                maxTextLength = maxTextLength > 0 ? parseInt(maxTextLength) : 0;

                if (maxTextLength > 0) {
                    let longText = el.html();

                    // do not count HTML tags, more than one successive whitespace, or newlines towards the maxTextLength
                    const correctedLength = longText.replace(/<[^>]+>/gm, '').replace(/ +(?= )/g, '').replace(/(\r\n|\n|\r)/gm, '').length;
                    let shortText = longText.substr(0, maxTextLength + (longText.length - correctedLength));

                    // do not cut off words, instead shorten to nearest word
                    shortText = shortText.substr(0, Math.min(shortText.length, shortText.lastIndexOf(' ')));

                    if (correctedLength > maxTextLength) {
                        shortText +=
                            `... <br><a href="#" ng-click="show()">${$translate.instant('rv-truncate.showMore')}</a>`;
                        longText +=
                            ` <br><a href="#" ng-click="hide()">${$translate.instant('rv-truncate.showLess')}</a>`;
                    }

                    const changeTxt = txt => {
                        el.html(txt);
                        $compile(el.contents())(scope);
                    };

                    changeTxt(shortText);
                    scope.show = () => changeTxt(longText);
                    scope.hide = () => changeTxt(shortText);
                }
            });
        }
    }
})();
