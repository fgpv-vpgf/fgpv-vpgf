/* global Ease, BezierEasing, TweenLite */
(() => {
    'use strict';

    const RV_TOGGLE_SLIDE_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

    /**
     * @ngdoc service
     * @name rvToggleSlide
     * @module app.ui.common
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
        .module('app.ui.common')
        .animation('.rv-toggle-slide', toggleOpenBuilder());

    // TODO: add option to change duration through an attribute

    function toggleOpenBuilder() {
        const service = {
            enter: toggleOpen,
            leave: toggleClose,
            addClass: ngShowHideBootstrap(true),
            removeClass: ngShowHideBootstrap(false)
        };

        return () => service;

        ////////

        /**
         * Animates `leave` event by `sliding` the element down, animating its height from 0 to full.
         * @param  {object}   element  node
         * @param  {callback} callback
         */
        function toggleOpen(element, callback) {
            let targetHeight = open ? getTargetHeight(element) : 0;

            TweenLite.fromTo(element, RV_TOGGLE_SLIDE_DURATION, {
                height: 0
            }, {
                height: targetHeight,
                ease: RV_SWIFT_IN_OUT_EASE,
                onComplete: () => {
                    element.css('height', 'auto');
                    callback();
                }
            });
        }

        /**
         * Animates `leave` event by `sliding` the element up, animating its height from full to 0.
         * @param  {object}   element  node
         * @param  {callback} callback
         */
        function toggleClose(element, callback) {
            TweenLite.to(element, RV_TOGGLE_SLIDE_DURATION, {
                height: 0,
                ease: RV_SWIFT_IN_OUT_EASE,
                onComplete: () => callback()
            });
        }

        /**
         * When using `ng-show` or `ng-hide`, animation is triggered on `addClass`, `removeClass`, and `setClass`. See more here: https://docs.angularjs.org/api/ng/service/$animate#addClass
         *
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
         * @param  {object} element node
         */
        function getTargetHeight(element) {
            // reset height to default if animating from hidden element as it's initial height can be 0 set by preceding hide animation

            return element
                .css('height', 'auto')
                .prop('clientHeight');
        }
    }
})();
