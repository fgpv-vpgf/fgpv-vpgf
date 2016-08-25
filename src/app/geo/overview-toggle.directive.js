/* global TimelineLite */
(() => {
    'use strict';

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

    function rvOverviewToggle($compile, $rootElement, $rootScope) {
        const directive = {
            restrict: 'A',
            /* jscs:disable maximumLineLength */
            template: ` <div class="overview-toggle">
                            <md-button
                                translate
                                translate-attr-aria-label="geo.aria.overviewtoggle"
                                class="md-icon-button rv-button-24 md-button"
                                tabindex="0"
                                ng-click="toggleOverview()">
                                <md-icon md-svg-src="community:apple-keyboard-control"></md-icon>
                            </md-button>
                        </div>`,
            /* jscs:enable maximumLineLength */
            scope: {},
            link: link
        };

        return directive;

        function link(scope, el) {

            const overviewAnimation = new TimelineLite({ paused: true });
            scope.toggleOverview = toggleOverview;

            // default overview map to expanded state
            if (typeof $rootScope.overviewActive === 'undefined') {
                $rootScope.overviewActive = true;
            }

            overviewAnimation
                .fromTo(el.prev(), 0.5, // expand/shrink overview map
                    { width: 40, height: 40 },
                    { width: 200, height: 200 }, 0)
                .to(el.find('md-icon').first(), 0.5, { // rotate toggle icon
                    directionalRotation: '45_cw'
                }, 0);

            el.siblings('div.ovwButton').remove(); // remove esri button
            animate();

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
                return $rootScope.overviewActive ? overviewAnimation.play() : overviewAnimation.reverse();
            }
        }
    }
})();
