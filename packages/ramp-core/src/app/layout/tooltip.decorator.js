const TOOLTIP_TOUCH_DELAY = 750;

/**
 * @module mdTooltipDirective
 * @memberof material.components.tooltip
 * @requires $delegate
 * @requires $rootElement
 * @requires $timeout
 * @description
 *
 * The `mdTooltipDirective` decorates the vanilla mdTooltip.
 * Modifies display logic if touch mode is on.
 */
angular
    .module('material.components.tooltip')
    .decorator('mdTooltipDirective', mdTooltipDirective);

function mdTooltipDirective($delegate, $rootElement, $timeout) {

    const mdTooltipDirective = $delegate[0]; // get the vanilla directive
    const originalCompile = mdTooltipDirective.compile; // store reference to its compile function
    mdTooltipDirective.compile = decorateCompile(originalCompile); // decorate compile function

    return ([mdTooltipDirective]);

    /**
     * Decorates the original tooltip compile functions.
     * @function decorateCompile
     * @param  {Function} originalCompile original compile function
     * @return {Function}                 enhances link function returned by the decorated compile function which modifies display logic if touch mode is on
     */
    function decorateCompile(originalCompile) {
        return (...args) => {
            const originalLink = originalCompile(...args);

            // return a decorated link function
            return (scope, el, attrs, ctrls) => {
                let showTooltipTimeout;

                // if touch mode is on - hide the tooltip on touchstart, then show it after 1 second if no touchend or touchcancel event is fired
                // did not use native md-delay since we don't want to change the delay for mouse hovers or on focus, just touch.
                // md-visible did/does not work for managing the visibility of the tooltip; this may be a bug or the documentation is misleading on its use.
                el.parent()
                    .on('touchstart', () => {
                        if (isTouch()) {
                            showTooltipTimeout = $timeout(() => el.removeClass('rv-hide'), TOOLTIP_TOUCH_DELAY);
                        } else {
                            el.removeClass('rv-hide');
                        }
                    }).on('touchend touchcancel', () =>
                        isTouch() ? $timeout.cancel(showTooltipTimeout) : undefined);

                /**
                 * Returns whether touch mode is on, and if it is, ensures the tooltip is hidden.
                 * @function isTouch
                 * @private
                 * @return {Boolean}    true iff touch mode is on, false otherwise
                 */
                function isTouch() {
                    if ($rootElement.hasClass('rv-touch')) {
                        el.addClass('rv-hide');
                        return true;
                    }
                    return false;
                }

                originalLink(scope, el, attrs, ctrls);
            };
        };
    }
}
