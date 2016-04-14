(() => {
    'use strict';

    /**
     * @ngdoc decorator
     * @name mdMenuItemDirectiveDecorator
     * @module material.components.menuBar
     * @requires $delegate
     * @description
     *
     * The `mdMenuItemDirectiveDecorator` decorates vanilla `mdMenuItemDirective`.
     * There is a bit of inconsistency in how regular menu items and radio/checkbox menu items are rendered in Angular Material. In regular menu items, icon is inside the button node; in radio/checkbox item, outside (before) the button node. They go into some trouble absolutely positioning the icon.
     * An unintended sideeffect pops up when the menu service positions the menu on the page. It takes the first child of the first visible menu item and positions the menu based on the coordinates of that node. If the first item is a radio/checkbox item and it's not selected, its icon is hidden using `display="none"`. This is the item picked by the menu service, and being hidden, it has coordinates/offets of 0,0,0,0 which messes up menu positioning greatly. See here: https://cloud.githubusercontent.com/assets/2285779/14535696/0ce380cc-023d-11e6-8e26-eb9cfd73c534.gif
     *
     * This decorator moves the icon inside the button node to keep it consistent with other menu items and fix the positioning issue.
     *
     */

    angular
        .module('material.components.menuBar')
        .decorator('mdMenuItemDirective', mdMenuItemDirectiveDecorator);

    function mdMenuItemDirectiveDecorator($delegate) {
        'ngInject';

        const mdMenuItemDirective = $delegate[0]; // get the vanilla directive
        const originalCompile = mdMenuItemDirective.compile; // store reference to its compile function
        mdMenuItemDirective.compile = decorateCompile(originalCompile); // decorate compile function

        return ([mdMenuItemDirective]);

        /**
         * Decorates the original menuItem compile functions.
         * @param  {Function} originalCompile original compile function
         * @return {Function}                 enhances link function returned by the decorated compile function which moves the icon node inside the button node.
         */
        function decorateCompile(originalCompile) {
            return (...args) => {
                const originalLink = originalCompile(...args);

                // return a decorated link function
                return (scope, el, attrs, ctrls) => {
                    // call the original link function
                    originalLink(scope, el, attrs, ctrls);

                    // move the icon inside the button node
                    const icon = el.find(' > md-icon');
                    const button = el.find(' > .md-button');
                    if (icon.length > 0 && button.length > 0) {
                        button.prepend(icon);
                    }
                };
            };
        }
    }
})();
