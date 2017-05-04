/* global Ease, BezierEasing */
(() => {
    'use strict';
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

    /**
     * @module rvOverviewToggle
     * @memberof app.geo
     * @restrict A
     * @description
     *
     * Replaces the default ESRI map overview toggle button so that it is accessible (focusable) and
     * improves its aesthetics.
     *
     * This directive works as follows:
     *      1. This directive should be injected as a sibling to the ESRI map overview toggle button
     *      2. We remove the ESRI map overview toggle button from the DOM
     *      3. When a user clicks on our toggle button we animate the expanding/shrinking of the overview map
     *      4. When the user changes projections, repeat
     *
     * Overview expanded state is maintained during projection changes
     */
    angular
        .module('app.layout')
        .directive('rvOverviewToggle', rvOverviewToggle);

    function rvOverviewToggle($compile, $rootScope, geoService, $timeout, animationService) {
        const directive = {
            restrict: 'E',
            template: `
                <md-button
                    translate
                    aria-label="{{ geo.aria.overviewtoggle | translate }}"
                    class="md-icon-button rv-button-24 md-button"
                    tabindex="-2"
                    ng-click="toggleOverview()">
                    <md-icon md-svg-src="community:apple-keyboard-control"></md-icon>
                </md-button>`,
            scope: {},
            link: link
        };

        return directive;

        function link(scope, el) {

            const overviewAnimation = animationService.timeLineLite({
                paused: true,
                onComplete: animationCompleted,
                onReverseComplete: () => animationCompleted(true)
            });

            let timeoutPromise;

            scope.toggleOverview = toggleOverview;

            overviewAnimation
                .to(el.parent(), 0.3, {
                    width: 40,
                    height: 40,
                    ease: RV_SWIFT_IN_OUT_EASE }, 0)
                .to(el, 0.3, { // rotate toggle icon
                    top: '-=3',
                    right: '-=3',
                    directionalRotation: '225_ccw'
                }, 0);

            el.parent().siblings('div.ovwButton').remove(); // remove esri button

            // default overview map to expanded state. Using $rootScope here to preserve
            // state between projection changes (since this directive is destroyed and re-created)
            if (typeof $rootScope.overviewActive === 'undefined') {
                $rootScope.overviewActive = true;
                el.parent().css({ width: 200, height: 200 });
            } else {
                animate();
            }

            /**
             * Adds/removes a class 'rv-minimized' to .esriOverviewMap so that the extent box is
             * hidden/shown. Corrects the overview map extent to its new box size.
             *
             * @param   {Boolean}   isReversed  if true overview map is full size, defaults to false
             *
             * @function animationCompleted
             */
            function animationCompleted(isReversed = false) {
                const overviewMapMap = geoService.map.instance.overviewMap.map;
                const esriNode = el.parent().parent();

                $timeout.cancel(timeoutPromise); // cancel existing timeout if present
                // $timeout workaround to prevent event collision with ESRI
                timeoutPromise = $timeout(() => overviewMapMap.setExtent(overviewMapMap.extent), 500);
                return !isReversed ? esriNode.addClass('rv-minimized') : esriNode.removeClass('rv-minimized');
            }

            /**
             * Toggles the overview map from visible to hidden and vice versa
             *
             * @function toggleOverview
             */
            function toggleOverview() {
                $rootScope.overviewActive = !$rootScope.overviewActive;
                animate();
            }

            /**
             * Plays or reverses the TimelineLite animation depending on the current expanded state
             *
             * @function animate
             */
            function animate() {
                if ($rootScope.overviewActive) {
                    overviewAnimation.reverse();
                } else {
                    overviewAnimation.play();
                }
            }
        }
    }
})();
