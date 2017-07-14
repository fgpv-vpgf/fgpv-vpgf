/**
 * @module rvTruncate
 * @memberof app.ui
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
    .module('app.ui')
    .directive('rvTruncate', rvTruncate)
    .directive('rvTruncateTitle', rvTruncateTitle);

/**
 * `rvTruncate` directive body.
 *
 * @function rvTruncate
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

/**
 * `rvTruncateTitle` truncates a given string by taking the middle part of the string out leaving the beginning and end intact.
 *
 * @function rvTruncateTitle
 * @param {Object} graphicsService common service providing helper function to work with canvas and svg
 * @return {object} directive body
 */
function rvTruncateTitle(graphicsService) {
    const directive = {
        restrict: 'A',
        scope: {
            title: '=rvTruncateTitle',
            isActive: '=?rvTruncateTitleIsActive'
        },
        link,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    const canvas = document.createElement('canvas');

    return directive;

    function link(scope, el) {
        let string = '';

        scope.$watch('self.title', newString => {
            if (newString) { string = newString; }
            update();
        });

        scope.$watch(() => el.width(), () => update());

        el.addClass('rv-truncate-title');

        /**
         * Updates the split string DOM node.
         *
         * @function update
         * @private
         */
        function update() {
            const [left, right] = splitString(string, el.width() - 10); // 10 accounts for letter spacing

            el.empty().append(`
                <span class="rv-truncate-title-left">${left}</span>
                <span calss="rv-truncate-title-right">${right}</span>
            `);

            scope.self.isActive = right !== '';
        }

        /**
         * Splits the given string into two parts:
         * left string can be arbitrary long and it will be truncated with an ellipsis using CSS but using flex-shrink;
         * right string must be smaller than the width of the container; this part will not be shrinkable;
         *
         * @function splitString
         * @private
         * @param {String} string title text
         * @param {Number} widthToFit container width that the title text needs to fit in
         * @return {Array} [leftString, rightString] parts of the original string
         */
        function splitString(string, widthToFit) {

            // TODO: use [getComputedStyles](https://developer.mozilla.org/en/docs/Web/API/Window/getComputedStyle) to get the actual font name and font size instead of this hardcoded font
            const stringWidth = graphicsService.getTextWidth(canvas, string, 'normal 16px Roboto');

            if (stringWidth < widthToFit) {
                return [string, ''];
            }

            const desiredStringLength = Math.floor(string.length * widthToFit / stringWidth * 0.3);

            return [
                string.substring(0, string.length - desiredStringLength),
                string.substring(string.length - desiredStringLength, string.length)
            ];
        }
    }
}
