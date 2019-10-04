/**
 * @module mdIconDirectiveDecorator
 * @memberof material.components.icon
 * @requires $delegate
 * @requires $timeout
 * @description
 *
 * The `mdIconDirectiveDecorator` decorates vanilla `mdIconDirective`.
 * It sets the svg childNode property 'focusable' to false so that when tabbing in IE 11 the svg element is not focusable.
 * Previously, both the button and the svg icon would gain focus while tabbing in IE 11 making the user tab twice to get to the
 * next button.
 */
angular
    .module('material.components.icon')
    .decorator('mdIconDirective', mdIconDirectiveDecorator);

function mdIconDirectiveDecorator($delegate) {
    'ngInject';

    const mdIconDirective = $delegate[0];
    const originalCompile = mdIconDirective.compile; // store reference to its compile function
    mdIconDirective.compile = decorateCompile(originalCompile); // decorate compile function

    return $delegate;

    /**
     * Decorates the original mdIcon compile functions.
     * @function decorateCompile
     * @param  {Function} originalCompile original compile function
     * @return {Function}                 enhances link function returned by the decorated compile function which fixes IE 11 tab issues
     */
    function decorateCompile(originalCompile) {
        return (...args) => {
            const originalLink = originalCompile(...args);

            // return a decorated link function
            return (scope, el, attrs, ctrls) => {
                // call the original link function
                originalLink(scope, el, attrs, ctrls);

                // used to prevent multiple callbacks from firing where svgElements.attr
                // can trigger another DOMSubtreeModified event
                let allowDOMSubtreeModified = false;
                el.on('DOMSubtreeModified', () => {
                    let svgElements = el.find('svg');
                    // always set to true if there are no svg elements since the next DOMSubtreeModified
                    // event could be triggered by adding an SVG element
                    allowDOMSubtreeModified = svgElements.length > 0 ? !allowDOMSubtreeModified : true;
                    if (allowDOMSubtreeModified) {
                        svgElements.attr('focusable', false);
                    }
                });
            };
        };
    }
}
