(() => {
    'use strict';

    /**
     * @restrict A
     * @module rvInitMap
     * @memberof app.geo
     * @description
     *
     * The `rvInitMap` directive creates an ESRI Map object on the DOM node it is attached to.  It is a string attribute which
     * will trigger the initialzation when set to 'true'.
     *
     * This directive also contains the keyboard navigation logic.
     */
    angular
        .module('app.geo')
        .directive('rvInitMap', rvInitMap);

    function rvInitMap(geoService, events, storageService, mapService, gapiService, $rootElement, $interval,
        globalRegistry) {

        // key codes that are currently active
        let keyMap = [];
        // interval which runs animation logic
        let animationInterval;

        const directive = {
            restrict: 'A',
            link: linkFunc
        };

        return directive;

        function linkFunc(scope, el) {
            // deregister after the first `rvReady` event as it's fired only once
            const deRegister = scope.$on(events.rvReady, () => {
                storageService.panels.map = el;
                geoService.assembleMap(el[0]);
                deRegister();
            });

            scope.$watch(() => geoService.isMapReady, () => {
                if (geoService.isMapReady) {
                    // disable the vendor built keyboard support
                    geoService.mapObject.disableKeyboardNavigation();
                    // reduce map animation time which in turn makes panning less jittery
                    gapiService.gapi.mapManager.mapDefault('panDuration', 0);
                    gapiService.gapi.mapManager.mapDefault('panRate', 0);

                    el.on('keydown', keyDownDetected);
                    el.on('keyup', keyUpDetected);

                }
            });
        }

        /**
         * Ensures this directive has focus before any key presses become active. If so
         * registers the key as active and starts animation.
         *
         * @function keyDownDetected
         * @param {Object} event     the keydown/keyup browser event
         */
        function keyDownDetected(event) {
            // prevent arrow keys from scrolling the page
            if (event.which >= 37 && event.which <= 40) {
                event.preventDefault(true);
            }

            if (event.which === 9) { // tab key should clear all active keys
                keyMap = [];
                stopAnimate();

            } else if (keyMap.indexOf(event.which) === -1) {
                // enable keyboard support only when map is focused
                if (storageService.panels.map.is($(document.activeElement))) {
                    keyMap.push(event.which);
                    animate(event);
                }
            }
        }

        /**
         * Removes the key from keyMap so that it is no longer active
         *
         * @function keyUpDetected
         * @param {Object} event     the keydown/keyup browser event
         */
        function keyUpDetected(event) {
            let keyMapIndex = keyMap.indexOf(event.which);

            if (keyMapIndex !== -1) {
                keyMap.splice(keyMapIndex, 1);
            }

            animate(event);
        }

        /**
         * Handles the pan, zoom, and identify logic based on the active keys
         *
         * @function animate
         * @param {Object} event     the keydown/keyup browser event
         */
        function animate() {
            /*jshint maxcomplexity:16 */
            stopAnimate();
            if (keyMap.length === 0) {
                return;
            }

            // calculate the pan distance of x and y in Point format given some
            // x and y in ScreenPoint format (currently 10). This ensures we pan by some
            // arbitrary constant pixel which won't change with zooming (as opposed to panning by distance)
            let mapPntCntr = geoService.mapObject.extent.getCenter();
            let mapScrnCntr = geoService.mapObject.toScreen(mapPntCntr);
            mapScrnCntr.x += 10;
            mapScrnCntr.y += 10;
            let mapPntHorDiff = Math.abs(geoService.mapObject.toMap(mapScrnCntr).x - mapPntCntr.x);
            let mapPntVertDiff = Math.abs(geoService.mapObject.toMap(mapScrnCntr).y - mapPntCntr.y);

            let x = 0;
            let y = 0;
            let hasShiftMultiplier = 1;
            for (let i = 0; i < keyMap.length; i++) {
                switch (keyMap[i]) {
                    // enter key is pressed - trigger identify
                    case 13:
                        // prevent identify if focus manager is in a waiting state since ENTER key is used to activate the focus manager.
                        // Also disable if SHIFT key is depressed so identify is not triggered on leaving focus manager
                        if ($rootElement.attr('rv-focus-status') === globalRegistry.focusStatusTypes.ACTIVE) {
                            event.mapPoint = mapPntCntr;
                            event.screenPoint = mapScrnCntr;
                            geoService.state.identifyService.clickHandler(event);
                        }
                        break;
                    // shift key pressed - pan distance increased
                    case 16:
                        hasShiftMultiplier = 2;
                        break;
                    // left arrow key pressed
                    case 37:
                        x -= mapPntHorDiff;
                        break;
                    // up arrow key pressed
                    case 38:
                        y += mapPntVertDiff;
                        break;
                    // right arrow key pressed
                    case 39:
                        x += mapPntHorDiff;
                        break;
                    // down arrow key pressed
                    case 40:
                        y -= mapPntVertDiff;
                        break;
                    // + (plus) key pressed - zoom in
                    case 187:
                        geoService.shiftZoom(1);
                        break;
                    // + (plus) key pressed - FF and IE
                    case 61:
                        geoService.shiftZoom(1);
                        break;
                    // - (minus) key pressed - zoom out
                    case 189:
                        geoService.shiftZoom(-1);
                        break;
                    // - (minus) key pressed - FF and IE
                    case 173:
                        geoService.shiftZoom(-1);
                        break;
                }
            }

            // continue updating x and y when arrow keys are being held down, but
            // only if one or both are not 0 (holding down left and right arrow will
            // result in x = 0 so no animation is run)
            if (x !== 0 || y !== 0) {
                animationInterval = $interval(() => {
                    mapPntCntr.x += hasShiftMultiplier * x;
                    mapPntCntr.y += hasShiftMultiplier * y;
                    geoService.mapObject.centerAt(mapPntCntr);
                }, 40);
            }
        }

        function stopAnimate() {
            if (typeof animationInterval !== 'undefined') {
                $interval.cancel(animationInterval);
                animationInterval = undefined;
            }
        }
    }
})();
