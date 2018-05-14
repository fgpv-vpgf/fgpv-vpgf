const RV_MORPH_DURATION = 0.3;
const RV_SWIFT_IN_OUT_EASE = window.Power1.easeInOut;

/**
 * @module rvMorph
 * @memberof app.ui
 * @restrict A
 * @description
 *
 * The `rvMorph` directive animates the given HTML element from one CSS class to another provided to the `rvMorph` attribute. The element is morphed by using GSAP animation library. Only class changes are animated - the first class is applied immediately; when removed, applied immediately as well.
 *
 * ```html
 * <!-- when $scope.myValue changes from `value1` to `value2`, the transition is animated -->
 * <div rv-morph="myValue"></div>
 * ```
 * The value of `rv-morph` attribute is added to the CSS classes of the element after transition completes; the old class value is removed.
 *
 * Optional `rv-morph-speed` attribute can be added to the element to change the animation speed from the default 0.3s.
 *
 * ```html
 * <!-- transition will take 10 seconds -->
 * <div rv-morph="myValue" rv-morph-speed="10"></div>
 * ```
 *
 * `rv-morph` should not be applied to elements that are animated by different means (ngAnimate or other CSS animations), this may interfere with applying of CSS classes.
 */
angular
    .module('app.ui')
    .directive('rvMorph', rvMorph);

/**
 * `rvMorph` directive body.
 *
 * @private
 * @function rvMorph
 * @return {object} directive body
 */
function rvMorph(stateManager, animationService) {
    const directive = {
        restrict: 'A',
        link: linkFunc
    };

    return directive;

    /**
     * Directive's link function. Sets up a watch on the `ng-morph` attribute and triggers the animation on attribute change.
     * Initial setting and nulling of the attribute causes immediate change with no animation.
     *
     * @function linkFunc
     * @param  {Object} scope directive's scope
     * @param  {Object} el    element reference
     * @param  {Object} attr  element's attributes
     */
    function linkFunc(scope, el, attr) {
        let classReg;
        let toClass;
        scope.stateManager = stateManager;

        scope.$watch(`stateManager.state.${attr.rvMorph}.morph`, (newClass, oldClass) => {
            // replace old class name with new on the element to get a morph target
            classReg = new RegExp('(^| )' + oldClass + '($| )', 'i');
            toClass = el.attr('class')
                .replace(classReg, '$1' + newClass + '$2');

            // animate only on class change
            if (newClass !== oldClass) {

                // skip morph
                if (stateManager.state[attr.rvMorph].morphSkip) {
                    el.removeClass(oldClass).addClass(newClass);
                    callback();
                } else {
                    animationService.to(el, attr.rvMorphSpeed || RV_MORPH_DURATION, {
                        className: toClass,
                        ease: RV_SWIFT_IN_OUT_EASE,
                        onComplete: () => {
                            // Remove old class from the element after morph is completed.
                            el.removeClass(oldClass);
                            callback();
                        }
                    });
                }

            } else {
                el.addClass(newClass);
            }
        });

        function callback() {
            stateManager.callback(attr.rvMorph, 'morph');
        }
    }
}
