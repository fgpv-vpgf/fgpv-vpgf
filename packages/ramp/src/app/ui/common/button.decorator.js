/**
 * @module MdButtonDirectiveDecorator
 * @memberof material.components.button
 * @description
 *
 * Corrects an issue with angular materials md-button directive where interpolated values are not wrapped in a span element.
 * Offending line: https://github.com/angular/material/blob/master/src/components/button/button.js#L146
 */

angular
    .module('material.components.button')
    .decorator('mdButtonDirective', MdButtonDirectiveDecorator);

function MdButtonDirectiveDecorator($delegate, $interpolate) {
    'ngInject';

    const MdButtonDirective = $delegate[0]; // get the vanilla directive
    const originalCompile = MdButtonDirective.compile; // store reference to its compile function
    MdButtonDirective.compile = decorateCompile(originalCompile); // decorate compile function

    return ([MdButtonDirective]);

    /**
     * Decorates the original button compile functions.
     * @function decorateCompile
     * @param  {Function} originalCompile original compile function
     * @return {Function}                 enhances link function returned by the decorated compile function
     */
    function decorateCompile(originalCompile) {
        return (...args) => {
            const originalLink = originalCompile(...args);

            // return a decorated link function
            return (scope, el, attrs, ctrls) => {
                originalLink(scope, el, attrs, ctrls);

                el
                    .contents()
                    .filter(function() {
                        return this.nodeType === 3 && this.nodeValue.trim().length > 0;
                    })
                    .wrap('<span></span>');
            };
        };
    }
}
