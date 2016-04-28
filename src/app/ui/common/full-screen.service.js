/* global TimelineLite, TweenLite, Ease, BezierEasing */
(() => {
    'use strict';

    const RV_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

    /**
     * @ngdoc service
     * @name fullscreen
     * @module app.ui.common
     * @requires dependencies
     * @description
     *
     * The `fullscreen` factory description.
     *
     */
    angular
        .module('app.ui.common')
        .factory('fullScreenService', fullScreenService);

    function fullScreenService($rootElement, $timeout, events, storageService, gapiService, geoService) {
        const service = {
            toggle
        };

        const ref = {
            isExpanded: false,
            tl: undefined,

            tlCollapse: undefined,

            mapContainerNode: undefined,
            shellNode: undefined,
            shellNodeBox: undefined,

            trueCenterPoint: undefined
        };

        return service;

        /***/

        function toggle() {
            // FIXME:
            gapiService.gapi.debug(true);

            // pause and kill current running animation
            if (ref.tl) {
                ref.tl.pause().kill();
            }

            ref.trueCenterPoint = geoService.mapObject.extent.getCenter();

            if (!ref.isExpanded) {

                ref.tl = new TimelineLite({
                    paused: true,
                    onComplete
                });

                ref.mapContainerNode = storageService.panels.map.find('> .container > .container');
                ref.shellNode = storageService.panels.shell;
                ref.shellNodeBox = ref.shellNode[0].getBoundingClientRect();

                // make overflow on the root element visible so we can 'pop' the map shell out
                ref.tl.set($rootElement, {
                    overflow: 'visible'
                });

                ref.tl.set(ref.shellNode, {
                    position: 'fixed',
                    top: ref.shellNodeBox.top,
                    left: ref.shellNodeBox.left,
                    bottom: window.innerHeight - ref.shellNodeBox.bottom,
                    right: document.body.clientWidth - ref.shellNodeBox.right, // width without scrollbars
                    'z-index': 999,
                    height: 'auto',
                    width: 'auto',
                    margin: 0
                });

                ref.tl.to(ref.mapContainerNode, RV_DURATION,
                    {
                        top: window.innerHeight / 2 - ref.shellNodeBox.height / 2,
                        left: document.body.clientWidth / 2 - ref.shellNodeBox.width / 2,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0
                );

                ref.tl.to(ref.shellNode, RV_DURATION, {
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                ref.isExpanded = !ref.isExpanded;
                ref.tl.play();
            } else {
                ref.tl = new TimelineLite({
                    paused: true,
                    onComplete
                });

                ref.tl.to(ref.mapContainerNode, RV_DURATION,
                    {
                        top: -(window.innerHeight / 2 - ref.shellNodeBox.height / 2),
                        left: -(document.body.clientWidth / 2 - ref.shellNodeBox.width / 2),
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0
                );

                ref.tl.to(ref.shellNode, RV_DURATION, {
                    top: ref.shellNodeBox.top,
                    left: ref.shellNodeBox.left,
                    bottom: window.innerHeight - ref.shellNodeBox.bottom,
                    right: document.body.clientWidth - ref.shellNodeBox.right, // width without scrollbars
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                ref.tl.set(ref.shellNode, {
                    clearProps: 'all'
                });

                ref.tl.set($rootElement, {
                    clearProps: 'all'
                });

                ref.isExpanded = !ref.isExpanded;
                ref.tl.play();
            }
        }

        function onComplete() {
            const originalPanDuration = gapiService.gapi.esriBundle().esriConfig.defaults.map.panDuration;
            gapiService.gapi.esriBundle().esriConfig.defaults.map.panDuration = 0;

            $timeout(() => {
                // center the map
                geoService.mapObject.centerAt(ref.trueCenterPoint);

                // clear offset properties on the map container node
                TweenLite.set(ref.mapContainerNode, {
                    clearProps: 'top,left'
                });

                // restore orignal pan duration value
                gapiService.gapi.esriBundle().esriConfig.defaults.map.panDuration = originalPanDuration;
            }, RV_DURATION * 1.5 * 1000);
        }
    }
})();
