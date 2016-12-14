/* global TimelineLite, TweenLite, Ease, BezierEasing */
(() => {
    'use strict';

    const RV_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));
    const FULL_SCREEN_Z_INDEX = 50;
    // README: this is a simplest solution to https://github.com/fgpv-vpgf/fgpv-vpgf/issues/671
    // Angular Material uses z-index of 100 for the drop-menu, setting app's z-index below that will allow for the menu to show up while still blocking the host page
    // There might be a problem if the host page uses z-indexes larger than 50 or 100, in which case full-screen would not work.
    // A more complete solution would be to override $z-index- variables defined in Angular Material with higher values and up z-index here as well.
    // There seems to be some of the z-index- in Angular Material which are not derived from variables (in version 1.0.5);
    // This should be revisited after upgrading Angular Material or in case additional bug reports (host page having higher z-index for example)

    /**
     * @module fullScreenService
     * @memberof app.ui
     * @requires $rootElement, $timeout, storageService, gapiService, geoService
     * @description
     *
     * The `fullscreen` factory makes the map go "Boom!".
     *
     */
    angular
        .module('app.ui.common')
        .factory('fullScreenService', fullScreenService);

    function fullScreenService($rootElement, $timeout, storageService, gapiService, geoService) {
        const ref = {
            isExpanded: false,
            tl: undefined,

            body: angular.element('body'),

            mapContainerNode: undefined,
            shellNode: undefined,
            shellNodeBox: undefined,

            trueCenterPoint: undefined
        };

        const service = {
            toggle,
            isExpanded: () => ref.isExpanded
        };

        return service;

        /***/

        /**
         * Toggles the full-screen state by running animation which expands the shell node to take over the entire page at the same time animating the map container node to the map centered in the expanding container; reverse animation works similarly.
         * @function toggle
         */
        function toggle() {
            // pause and kill currently running animation
            if (ref.tl) {
                ref.tl.pause().kill();
            }

            // store current center point of the map
            ref.trueCenterPoint = geoService.mapObject.extent.getCenter();

            if (!ref.isExpanded) {

                ref.tl = new TimelineLite({
                    paused: true,
                    onComplete
                });

                // get the container of all map layers
                ref.mapContainerNode = storageService.panels.map.find('> .container > .container');
                ref.shellNode = storageService.panels.shell;
                ref.shellNodeBox = ref.shellNode[0].getBoundingClientRect();

                // make overflow on the root element visible so we can 'pop' the map shell out
                ref.tl.set($rootElement, {
                    overflow: 'visible',
                    'z-index': FULL_SCREEN_Z_INDEX
                });

                // pop out shell to make it ready for animation
                ref.tl.set(ref.shellNode, {
                    position: 'fixed',
                    top: ref.shellNodeBox.top,
                    left: ref.shellNodeBox.left,
                    bottom: window.innerHeight - ref.shellNodeBox.bottom,
                    right: document.body.clientWidth - ref.shellNodeBox.right, // width without scrollbars
                    'z-index': FULL_SCREEN_Z_INDEX,
                    height: 'auto',
                    width: 'auto',
                    margin: 0
                });

                // animate map layer container in the opposite direction to counteract its drifting up and left
                ref.tl.to(ref.mapContainerNode, RV_DURATION, {
                    top: window.innerHeight / 2 - ref.shellNodeBox.height / 2,
                    left: document.body.clientWidth / 2 - ref.shellNodeBox.width / 2,
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                // animate shell taking over the page
                ref.tl.to(ref.shellNode, RV_DURATION, {
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                // rv-full-screen class will hide all the host page content except the full-screened viewer
                ref.tl.set(ref.body, { className: '+=rv-full-screen' });

                ref.isExpanded = !ref.isExpanded;
                ref.tl.play();
            } else {
                ref.tl = new TimelineLite({
                    paused: true,
                    onComplete
                });

                // need to restore host page content to visibility
                ref.tl.set(ref.body, { className: '-=rv-full-screen' });

                // animate map layer container in the oppositve directive to counteract collapse of the shell
                ref.tl.to(ref.mapContainerNode, RV_DURATION, {
                    top: -(window.innerHeight / 2 - ref.shellNodeBox.height / 2),
                    left: -(document.body.clientWidth / 2 - ref.shellNodeBox.width / 2),
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                // animate collapse of the shell to its previous size
                ref.tl.to(ref.shellNode, RV_DURATION, {
                    top: ref.shellNodeBox.top,
                    left: ref.shellNodeBox.left,
                    bottom: window.innerHeight - ref.shellNodeBox.bottom,
                    right: document.body.clientWidth - ref.shellNodeBox.right, // width without scrollbars
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                // clear all properties left after animation completes
                ref.tl.set(ref.shellNode, {
                    clearProps: 'all'
                });

                // clear all properties left after animation completes
                ref.tl.set($rootElement, {
                    clearProps: 'all'
                });

                ref.isExpanded = !ref.isExpanded;
                ref.tl.play();
            }
        }

        /**
         * Cleans up after the full-screen animation completes.
         * Removes leftover properties from the map container node and re-centers the map.
         * @private
         * @function onComplete
         */
        function onComplete() {
            const mapManager = gapiService.gapi.mapManager;
            const originalPanDuration = mapManager.mapDefault('panDuration');
            mapManager.mapDefault('panDuration', 0);

            geoService.mapObject.resize();
            geoService.mapObject.reposition();

            // wait for a bit before recentring the map
            // if call right after animation completes, the map object still confused about its true size and extent
            $timeout(() => {
                // center the map
                geoService.mapObject.centerAt(ref.trueCenterPoint);

                // clear offset properties on the map container node
                TweenLite.set(ref.mapContainerNode, {
                    clearProps: 'top,left'
                });

                mapManager.mapDefault('panDuration', originalPanDuration);
            }, RV_DURATION * 1000);
        }
    }
})();
