/**
 * @module $mdDialog
 * @memberof material.components.dialog
 * @requires $delegate, $q
 * @description
 *
 * The `mdDialog` decorator modifies the angular material $mdDialog service
 */

angular.module('material.components.dialog').decorator('$mdDialog', mdDialog);

function mdDialog($delegate, $q) {
    'ngInject';

    const origShow = $delegate.show;

    $delegate.show = show;
    return $delegate;

    /**
     * Modifies existing dialog show function such that focus is always correctly applied by
     * the focus manager to the opened dialog by default, unless the 'focusOnOpen' option is explicitly false.
     *
     * @private
     * @function show
     * @param      {Object}     opts angular material optionsOrPreset object https://material.angularjs.org/latest/api/service/$mdDialog
     * @return     {Promise}    resolves to undefined when the opening dialog animation is complete
     */
    function show(opts) {
        return $q(resolve => {
            opts.focusOnOpen = opts.focusOnOpen === false ? false : true;

            const originalOnShowing = opts.onShowing;
            opts.onShowing = (scope, element) => {
                // wrap dialog into a content node, but only once
                if (element.find('.rv-inner-shell').length === 0) {
                    element.find('md-dialog').wrap('<div class="rv-inner-shell"></div>');
                }

                // run original `onShowing` callback
                if (originalOnShowing) {
                    originalOnShowing(scope, element);
                }
            };

            opts.onComplete = (_, element) => {
                // these traps are not needed and can cause issues, remove from DOM
                element.find('.md-dialog-focus-trap').remove();

                // keep focus within the dialog
                element
                    .find('md-dialog')
                    .attr('rv-trap-focus', '')
                    .removeAttr('tabindex');

                // rv-focus attribute in dialogs bypasses default focus to close behaviour
                const rvFocus = element.find('[rv-focus]');
                if (rvFocus.length > 0) {
                    rvFocus.first().rvFocus();
                } else if (opts.focusOnOpen) {
                    // if an element with property rv-close-button exists we set focus on it. Sometimes the close button is
                    // not the first focusable element, but in most cases it should be the first focused element
                    const closeBtn = $(element).find('[rv-close-button]');
                    if (closeBtn.length === 0) {
                        element.nextFocus();
                    } else {
                        closeBtn.first().rvFocus();
                    }
                }

                resolve();
            };
            origShow(opts);
        });
    }
}
