/* global Ease, BezierEasing, TweenLite */
(() => {
    'use strict';

    const RV_TOGGLE_SLIDE_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = (new Ease(BezierEasing(0.35, 0, 0.25, 1)))
        .get;

    /**
     * @ngdoc service
     * @name rvToggleSlide
     * @module app.ui.common
     * @description
     *
     * The `rvToggleSlide` is an animation. It animates enter and leave events on any node by `sliding` it up or down, animating its height, when its added or removed from the dom.
     *
     * ```html
     * <div class="rv-toggle-slide"></div>
     * ```
     */
    angular
        .module('app.ui.common')
        .animation('.rv-toggle-slide', toggleOpenBuilder());

    // TODO: add option to change duration through an attribute

    function toggleOpenBuilder() {
        const service = {
            enter: toggleOpen,
            leave: toggleClose
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
         * Returns the height of the target element.
         * @param  {object} element node
         */
        function getTargetHeight(element) {
            return element
                .css('height', 'auto')
                .prop('clientHeight');
        }
    }
})();
