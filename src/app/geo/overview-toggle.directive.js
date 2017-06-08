import {Power1} from 'gsap';

const RV_SWIFT_IN_OUT_EASE = Power1;

const TEMPLATE = `
    <md-button
        translate
        aria-label="{{ 'geo.aria.overviewtoggle' | translate }}"
        class="md-icon-button rv-button-24 rv-overview-toggle"
        tabindex="-2"
        ng-click="self.toggleOverview()">
        <md-icon md-svg-src="community:apple-keyboard-control"></md-icon>
    </md-button>
`;

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

function rvOverviewToggle($compile, $rootScope, geoService, $timeout, animationService, events, configService) {
    const directive = {
        restrict: 'A',
        link: link
    };

    return directive;

    function link(scope, el) {
         // initializing
        events.$on(events.rvApiReady, init);

        // events.$on(events.rvBasemapChange, init);

        // TODO: instead of relying on esri event here, listen on it in map service and re-emit as rv-basemapchange event
        events.$on(events.rvApiReady, () =>
            configService.getSync.map.instance.basemapGallery.on('selection-change', init));

        const self = scope.self;
        self.overviewActive = true;

        const overviewScope = $rootScope.$new();
        overviewScope.self = self;

        let timeoutPromise;

        function init() {
            self.toggleOverview = toggleOverview;

            const overviewCompiledTemplate = $compile(TEMPLATE)(overviewScope);
            const ovwContainer = el.find('.ovwContainer');

            ovwContainer.append(overviewCompiledTemplate);

            const overviewAnimation = animationService.timeLineLite({
                paused: true,
                onComplete: animationCompleted,
                onReverseComplete: () => animationCompleted(true)
            });

            overviewAnimation
                .to(ovwContainer, 0.3, {
                    width: 40,
                    height: 40,
                    ease: RV_SWIFT_IN_OUT_EASE }, 0)
                .to(overviewCompiledTemplate, 0.3, { // rotate toggle icon
                    top: '-=3',
                    right: '-=3',
                    directionalRotation: '225_ccw'
                }, 0);

            if (self.overviewActive) {
                ovwContainer.css({ width: 200, height: 200 });
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
                const overviewMapMap = configService.getSync.map.instance.overviewMap.map;

                $timeout.cancel(timeoutPromise); // cancel existing timeout if present

                // $timeout workaround to prevent event collision with ESRI
                timeoutPromise = $timeout(() =>
                    overviewMapMap.setExtent(overviewMapMap.extent), 500);

                return !isReversed ?
                    ovwContainer.addClass('rv-minimized') :
                    ovwContainer.removeClass('rv-minimized');
            }

            /**
             * Toggles the overview map from visible to hidden and vice versa
             *
             * @function toggleOverview
             */
            function toggleOverview() {
                self.overviewActive = !self.overviewActive;
                animate();
            }

            /**
             * Plays or reverses the TimelineLite animation depending on the current expanded state
             *
             * @function animate
             */
            function animate() {
                if (self.overviewActive) {
                    overviewAnimation.reverse();
                } else {
                    overviewAnimation.play();
                }
            }
        }
    }
}
