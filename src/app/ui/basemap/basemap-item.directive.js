const templateUrl = require('./basemap-item.html');
const RV_DURATION = 0.3;
const RV_SWIFT_IN_OUT_EASE = window.Power1.easeInOut;

const BASEMAP_FOOTER = '.rv-basemap-footer';
const BASEMAP_DESCRIPTION = '.rv-basemap-description';
const BASEMAP_WKID_IMAGE = '.rv-wkid';

/**
 * @module rvBasemapItem
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvBasemapItem` directive displays a single basemap option in the basemap selector.
 *
 * ```html
 * <!-- `basemap` is an object containing basemap properties; see config schema -->
 * <rv-basemap-item basemap='basemap'></rv-basemap-item>
 * ```
 *
 */
angular
    .module('app.ui')
    .directive('rvBasemapItem', rvBasemapItem);

function rvBasemapItem(animationService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            basemap: '=',
            select: '&'
        },
        link: link,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /***/

    function link(scope, el) { // scope, el, attr, ctrl) {
        const self = scope.self;

        self.toggleDescription = toggleDescription;
        self.isDescriptionVisible = false;

        const descNode = el.find(BASEMAP_DESCRIPTION);
        const footer = el.find(BASEMAP_FOOTER);
        const wkidImage = el.find(BASEMAP_WKID_IMAGE);
        let tlToggle;

        /***/

        /**
         * Create animation timeline for toggle basemap description the first time the toggle is clicked and plays/reverses the animation on subsequent clicks.
         *
         * @function toggleDescription
         * @private
         */
        function toggleDescription() {
            if (!tlToggle) {
                const fullHeight = Math.max(
                    footer.outerHeight(true) + descNode.outerHeight(true),
                    el[0].getBoundingClientRect().height); // jQuery.height() returns rounded pixels, using boundingBox instead

                tlToggle = animationService.timeLineLite();
                tlToggle
                    .to(el, RV_DURATION / 3 * 2, {
                        height: fullHeight,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0)
                    .to(wkidImage, RV_DURATION / 3 * 2, {
                        opacity: 0.16,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0)
                    .set(descNode, {
                        top: 0
                    }, 0)
                    .to(descNode, RV_DURATION / 3 * 2, {
                        opacity: 1,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3)
                    .reverse();
            }

            // reversed reversed ? ... it works though.
            tlToggle.reversed(!tlToggle.reversed());
            self.isDescriptionVisible = !tlToggle.reversed();
        }
    }
}
