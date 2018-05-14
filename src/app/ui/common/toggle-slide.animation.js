const RV_TOGGLE_SLIDE_DURATION = 0.25;
const RV_TOGGLE_OPACITY_DURATION = 0.1;
const RV_SWIFT_IN_OUT_EASE = window.Power1.easeInOut;

let animSrv;

/**
 * @module rvToggleSlide
 * @memberof app.ui
 * @description
 *
 * The `rvToggleSlide` is an animation. It animates `enter` and `leave` events for `ng-if`; `addClass` and `removeClass`, for `ng-if` and `ng-show` directives on any node by `sliding` it up or down, animating its height, when its added or removed from the dom.
 *
 * ```html
 * <div class="rv-toggle-slide" ng-show="value"></div>
 * <div class="rv-toggle-slide" ng-hide="value"></div>
 *
 * <div class="rv-toggle-slide" ng-if="value"></div>
 * ```
 */
angular
    .module('app.ui')
    .animation('.rv-toggle-slide', toggleOpenBuilder());

// TODO: add option to change duration through an attribute

function toggleOpenBuilder() {
    const service = {
        enter: toggleOpen,
        leave: toggleClose,
        addClass: ngShowHideBootstrap(true),
        removeClass: ngShowHideBootstrap(false)
    };

    return animationService => {
        'ngInject';

        animSrv = animationService;
        return service;
    };

    /******/

    /**
     * Animates `leave` event by `sliding` the element down, animating its height from 0 to full.
     * @function toggleOpen
     * @param  {object}   element  node
     * @param  {callback} callback
     */
    function toggleOpen(element, callback) {
        const targetHeight = getTargetHeight(element);

        const animation = animSrv.timeLineLite();

        animation.fromTo(element, RV_TOGGLE_SLIDE_DURATION, {
            height: 0
        }, {
            height: targetHeight,
            ease: RV_SWIFT_IN_OUT_EASE
        }).fromTo(element, RV_TOGGLE_OPACITY_DURATION, {
            opacity: 0
        }, {
            opacity: 1,
            ease: RV_SWIFT_IN_OUT_EASE,
            onComplete: () => {
                element.css('height', 'auto');
                callback();
            }
        });
    }

    /**
     * Animates `leave` event by `sliding` the element up, animating its height from full to 0.
     * @function toggleClose
     * @param  {object}   element  node
     * @param  {callback} callback
     */
    function toggleClose(element, callback) {
        const animation = animSrv.timeLineLite();

        animation.fromTo(element, RV_TOGGLE_OPACITY_DURATION, {
            opacity: 1
        }, {
            opacity: 0,
            ease: RV_SWIFT_IN_OUT_EASE
        }).to(element, RV_TOGGLE_SLIDE_DURATION, {
            height: 0,
            ease: RV_SWIFT_IN_OUT_EASE,
            onComplete: () => callback()
        });
    }

    /**
     * When using `ng-show` or `ng-hide`, animation is triggered on `addClass`, `removeClass`, and `setClass`. See more here: https://docs.angularjs.org/api/ng/service/$animate#addClass
     *
     * @function ngShowHideBootstrap
     * @param  {boolean} addClass a flag indicating whether the `ng-hide` class was added or removed
     * @return {function}        bootstrapped open or close function
     */
    function ngShowHideBootstrap(addClass) {
        return (element, cssClass, callback) => {
            // both `ng-hide` and `ng-show` use `ng-hide` css class
            const action = {
                false: toggleOpen,
                true: toggleClose
            };

            // pick the action to perform;
            // `addClass` flips the action depending on whether the class is added or removed
            action[addClass](element, callback);
        };
    }

    /**
     * Returns the height of the target element.
     * @function getTargetHeight
     * @param  {object} element node
     */
    function getTargetHeight(element) {
        // reset height to default if animating from hidden element as it's initial height can be 0 set by preceding hide animation

        return element
            .css('height', 'auto')
            .prop('clientHeight');
    }
}
