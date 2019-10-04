/**
 * @module mdSelectDirective
 * @memberof material.components.menu
 * @description
 *
 * Allows mdMenus to set their own initial focus on open. After this, focus manager handles movement within the menu.
 */

angular
    .module('material.components.select')
    .decorator('mdSelectDirective', mdSelectDirective);

function mdSelectDirective($delegate) {
    'ngInject';

    const mdSelectDirective = $delegate[0]; // get the vanilla directive
    const originalCompile = mdSelectDirective.compile; // store reference to its compile function
    mdSelectDirective.compile = decorateCompile(originalCompile); // decorate compile function

    return ([mdSelectDirective]);

    /**
     * Decorates the original menu compile functions.
     * @function decorateCompile
     * @param  {Function} originalCompile original compile function
     * @return {Function}                 enhances link function returned by the decorated compile function
     */
    function decorateCompile(originalCompile) {
        return (...args) => {
            const originalLink = originalCompile(...args);

            // return a decorated link function
            return (scope, el, attrs, ctrls) => {
                // call the original link function
                originalLink(scope, el, attrs, ctrls);
                el.attr('tabindex', '-3');
            };
        };
    }
}
