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
     *      1. Initally this directive should be injected as a sibling to the ESRI map overview toggle button
     *      2. We remove the ESRI map overview toggle button from the DOM
     *      3. This triggers a MutationObserver callback which reinjects itself in the DOM in the same spot
     *      4. When a user clicks on our toggle button we animate the showing/hiding of the overview map
     *      5. When the user changes projections, goto step 3
     *
     * Note that the ESRI api removes/re-adds the entire overview map and toggle button when switching projections.
     */
    angular
        .module('app.layout')
        .directive('rvOverviewToggle', rvOverviewToggle);

    function rvOverviewToggle($compile, $rootElement) {
        const directive = {
            restrict: 'A',
            /* jscs:disable maximumLineLength */
            template: ` <div class="overview-toggle" style="position:absolute;top:12px;right:12px;">
                            <md-button class="md-icon-button rv-button-24 md-button" tabindex="0" ng-click="toggleOverview()">
                                <md-icon md-svg-src="{{overviewActive ? 'action:visibility' : 'action:visibility_off'}}"></md-icon>
                            </md-button>
                        </div>`,
            /* jscs:enable maximumLineLength */
            scope: {},
            link: link
        };

        return directive;

        function link(scope, el) {

            let overviewAnimation;

            scope.overviewActive = true; // true means overview map is visible
            scope.toggleOverview = toggleOverview;

            replaceOverviewButton();

            // create an observer instance
            var observer = new MutationObserver(() => {
                // Inject into the DOM before compiling so that we have access to siblings/parents/etc
                $rootElement.find('div.ovwContainer').after('<div rv-overview-toggle></div>');
                $compile($rootElement.find('div[rv-overview-toggle]')[0])(scope);
                observer.disconnect();
            });

            observer.observe(el.parent()[0], { childList: true });

            /**
             * Replaces the ESRI generated overview toggle button with our own
             *
             * @function replaceOverviewButton
             */
            function replaceOverviewButton() {
                el.siblings('div.ovwButton').remove(); // remove esri button
                overviewAnimation = new TimelineLite({ paused: true });
                overviewAnimation.fromTo(el.prev(), 0.5, { opacity: 0 }, { opacity: 1 });
                overviewAnimation.play();
            }

            /**
             * Toggles the overview map from visible to hidden and vice versa
             *
             * @function toggleOverview
             */
            function toggleOverview() {
                scope.overviewActive = !scope.overviewActive;
                return scope.overviewActive ? overviewAnimation.play() : overviewAnimation.reverse();
            }
        }
    }
})();
