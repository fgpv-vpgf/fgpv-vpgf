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

        let tlFullScreen;

        const ref = {
            mapContainerNode: null,
            shellNode: null,
            rootBox: null,
            trueCenterPoint: null
        };

        return service;

        /***/

        function toggle() {
            // FIXME:
            gapiService.gapi.debug(true);

            if (typeof tlFullScreen === 'undefined') {
                tlFullScreen = new TimelineLite({
                    paused: true,
                    onComplete,
                    onReverseComplete
                });

                ref.mapContainerNode = storageService.panels.map.find('> .container > .container');
                ref.shellNode = storageService.panels.shell;
                ref.rootBox = $rootElement[0].getBoundingClientRect();

                const mapContainerNodeOffset = ref.mapContainerNode[0].getBoundingClientRect();
                const trueCenterOffset = {
                    top: window.innerHeight / 2 - mapContainerNodeOffset.top,
                    left: document.body.clientWidth / 2 - mapContainerNodeOffset.left
                };

                ref.trueCenterPoint = geoService.mapObject.toMap(
                    gapiService.gapi.esriBundle().ScreenPoint(
                        trueCenterOffset.left, trueCenterOffset.top)
                );

                // make overflow on the root element visible so we can 'pop' the map shell out
                tlFullScreen.set($rootElement, {
                    overflow: 'visible'
                });

                //
                tlFullScreen.set(ref.shellNode, {
                    position: 'fixed',
                    top: ref.rootBox.top,
                    bottom: window.innerHeight - ref.rootBox.bottom,
                    right: document.body.clientWidth - ref.rootBox.right, // width without scrollbars
                    left: ref.rootBox.left,
                    'z-index': 999,
                    height: 'auto',
                    width: 'auto',
                    margin: 0
                });

                tlFullScreen.to(ref.mapContainerNode, RV_DURATION * 5, {
                    top: ref.rootBox.top,
                    left: ref.rootBox.left,
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                tlFullScreen.to(ref.shellNode, RV_DURATION * 5, {
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    ease: RV_SWIFT_IN_OUT_EASE
                }, 0);

                tlFullScreen.play();
            } else {
                tlFullScreen.reverse();
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
            }, RV_DURATION * 1000);
        }

        function onReverseComplete() {

        }
    }
})();
