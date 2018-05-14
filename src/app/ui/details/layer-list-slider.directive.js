const templateUrl = require('./layer-list-slider.html');

const RV_SLIDE_DURATION = 0.3;
const RV_SWIFT_IN_OUT_EASE = window.Power1.easeInOut;

/**
 * @module rvLayerListSlider
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvLayerListSlider` directive handles the in/out sliding of the details panel.
 *
 * The panel slides open when either any point layer is focused or on mouseover. It closes
 * when no point layers have focus, no mouseover, or the user clicked on a point layer.
 */
angular
    .module('app.ui')
    .directive('rvLayerListSlider', rvLayerListSlider);

function rvLayerListSlider(animationService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        link
    };

    return directive;

    function link(scope, element) {
        const self = scope.self;

        // create animation timeline
        const tl = animationService.timeLineLite({
            paused: true
        });

        let forceClose = false;

        tl.to(element, RV_SLIDE_DURATION, {
            width: 280,
            ease: RV_SWIFT_IN_OUT_EASE
        })

        // This will explicitly "animate" the overflow property from hidden to auto and not try to figure
        // out what it was initially on the reverse run.
            .fromTo(element, 0.01, {
                'overflow-y': 'hidden'
            }, {
                'overflow-y': 'auto'
            }, RV_SLIDE_DURATION / 2);

        // Place rv-expanded class on parent element once defined in details.directive.js
        const pElemWatcher = scope.$watch(self.getSectionNode, node => {
            if (typeof node !== 'undefined') {
                tl.to(node, RV_SLIDE_DURATION, {
                    className: '+=rv-expanded'
                }, 0);
                pElemWatcher();
            }
        });

        // focus moving away from directive, hiding
        element.on('focusout', event => {
            if (!$.contains(element[0], event.relatedTarget)) {
                animateClosed();
            }
        });

        element.on('focusin', animateOpen);

        /**
         * Handle layer selection on enter or space keypress. Sets focus to close button for accessibility
         * @function itemSelectedByKeypress
         * @param  {Object} evt the event object
         * @param  {Object} item the selected item
         */
        self.itemSelectedByKeypress = (evt, item) => {
            if (evt.which === 13 || evt.which === 32) {
                evt.preventDefault(true);
                animateClosed();
                self.selectItem(item);
            }
        };

        /**
         * Handle layer selection on mousedown.
         * @function itemSelectedByMouse
         * @param  {Object} item the selected item
         */
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

        /**
         * Starts the slider animation so layer list is expanded
         * @function animateOpen
         */
        function animateOpen() {
            if (tl.paused() || !forceClose) {
                tl.play();
            } else {
                forceClose = false;
            }
        }

        /**
         * Reverses the slider animation so layer list is contracted
         * @function animateClosed
         */
        function animateClosed() {
            tl.reverse();
        }
    }
}
