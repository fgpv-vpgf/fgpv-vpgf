/**
 * @module mdMenuDirective
 * @memberof material.components.menu
 * @description
 *
 * Allows mdMenus to set their own initial focus on open. After this, focus manager handles movement within the menu.
 */

angular
    .module('material.components.menu')
    .decorator('mdMenuDirective', mdMenuDirective);

function mdMenuDirective($delegate) {
    'ngInject';

    const mdMenuDirective = $delegate[0]; // get the vanilla directive
    const originalCompile = mdMenuDirective.compile; // store reference to its compile function
    mdMenuDirective.compile = decorateCompile(originalCompile); // decorate compile function

    return ([mdMenuDirective]);

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
                // allow menu directive to set initial focus
                el.find('md-menu-content').attr('rv-focus-init', '');
            };
        };
    }
}
