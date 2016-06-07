/* global Ease, BezierEasing, TimelineLite */
(() => {
    'use strict';
    const RV_SLIDE_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

    /**
     * @ngdoc directive
     * @name rvDetailSlider
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rvDetailSlider` directive handles the in/out sliding of the details panel.
     *
     * The panel slides open when either any point layer is focused or on mouseover. It closes
     * when no point layers have focus, no mouseover, or the user clicked on a point layer.
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailSlider', rvDetailSlider);

    function rvDetailSlider(stateManager) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-slider.html',
            link
        };

        return directive;

        function link(scope, element) {
            const self = scope.self;

            // create animation timeline
            const tl = new TimelineLite({
                paused: true
            });

            let forceClose = false;

            const animateOpen = () => {
                if (tl.paused()) {
                    tl.play();
                } else if (!forceClose) {
                    tl.reversed(false);
                } else {
                    forceClose = false;
                }
            };

            const animateClosed = () => tl.reversed(true);

            tl.to(element, RV_SLIDE_DURATION, {
                width: 280,
                ease: RV_SWIFT_IN_OUT_EASE,
                overflowY: 'auto'
            });

            // focus moving away from directive, hiding
            element.on('focusout', event => {
                if (!$.contains(element[0], event.relatedTarget)) {
                    animateClosed();
                    stateManager.nextFocus();
                }
            });

            element.on('focusin', animateOpen);

            self.itemSelectedByKeypress = (evt, item, isLast) => {
                if (evt.which === 13 || evt.which === 32 || evt.which === 33) {
                    evt.preventDefault();
                    animateClosed();
                    self.selectItem(item);
                    stateManager.nextFocus();

                } else if (isLast && evt.which === 9) {
                    evt.preventDefault();
                    stateManager.nextFocus();
                }
            };

            self.itemSelectedByMouse = item => {
                forceClose = true;
                animateClosed();
                self.selectItem(item);
            };

            // create jQuery hoverIntent object to open panel on slow mouseover
            element.hoverIntent({
                over: animateOpen,
                out: animateClosed,
                interval: 200
            });
        }
    }
})();
