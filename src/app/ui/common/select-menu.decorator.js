/**
 * @module mdSelectMenuDirective
 * @memberof material.components.select
 */
angular
    .module('material.components.select')
    .decorator('mdSelectMenuDirective', mdSelectMenuDirective);

function mdSelectMenuDirective($delegate, appInfo) {
    'ngInject';

    const mdSelectMenuDirective = $delegate[0]; // get the vanilla directive
    const originalCompile = mdSelectMenuDirective.compile; // store reference to its compile function
    mdSelectMenuDirective.compile = decorateCompile(originalCompile); // decorate compile function

    return ([mdSelectMenuDirective]);

    /**
     * Decorates the original menu compile functions.
     * @function decorateCompile
     * @param  {Function} originalCompile original compile function
     * @return {Function}                 enhances link function returned by the decorated compile function
     */
    function decorateCompile(originalCompile) {
        return (...args) => {
            const originalLink = originalCompile(...args);
            return (scope, el, attrs, ctrls) => {
                originalLink.pre(scope, el, attrs, ctrls); // note this directive uses a pre-link only
                el.attr('rv-focus-member', appInfo.id);
            };
        };
    }
}
