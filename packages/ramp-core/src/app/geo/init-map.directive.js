import Map from 'api/map';
import { BasemapGroup } from 'api/ui';
import gtm from '../tag-manager';
import { ConfigLegend } from 'api/legend';

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
angular.module('app.geo').directive('rvInitMap', rvInitMap);

function rvInitMap(
    $rootScope,
    configService,
    geoService,
    events,
    referenceService,
    $rootElement,
    $interval,
    identifyService,
    api,
    appInfo,
    gapiService,
    $mdDialog,
    keyNames,
    $compile,
    $controllerProvider
) {
    // key codes that are currently active
    let keyMap = [];
    // interval which runs animation logic
    let animationInterval;
    let mapInstance;

    const directive = {
        restrict: 'A',
        link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
        let mouseMoveHanlder;

        // deregister after the first `rvReady` event as it's fired only once
        const deRegister = scope.$on(events.rvReady, () => {
            referenceService.mapNode = el;
            geoService.assembleMap(/*el[0]*/);
            deRegister();
        });

        $rootScope.$on(events.rvMapLoaded, (_, i) => {
            mapInstance = i;

            mapInstance.disableKeyboardNavigation();

            // GTM application load time
            if (window.performance) {
                const timeSincePageLoad = Math.round(performance.now());
                if (api.gtmDL) {
                    api.gtmDL.push({
                        event: 'fieldTiming',
                        timingCategory: 'performance',
                        timingVariable: 'load',
                        timingLabel: 'mapLoaded',
                        timingValue: timeSincePageLoad
                    });
                }
            }

            // reduce map animation time which in turn makes panning less jittery
            mapInstance.mapDefault('panDuration', 0);
            mapInstance.mapDefault('panRate', 0);

            el.off('keydown', keyDownHandler)
                .off('keyup', keyUpHandler)
                .off('mousedown', mouseDownHandler)
                .off('mouseup', mouseUpHandler)

                .on('keydown', keyDownHandler)
                .on('keyup', keyUpHandler)
                .on('mousedown', mouseDownHandler)
                .on('mouseup', mouseUpHandler);

            // API related initialization ------------------
            api.GAPI = api.GAPI ? api.GAPI : gapiService.gapi;
            api.isIE11 = appInfo.isIE11;
            const apiMap = new Map($rootElement);
            apiMap.fgpMap = mapInstance;
            apiMap._legendStructure = configService.getSync.map.legend;
            const mapConfig = configService.getSync.map;
            apiMap.ui.configLegend = new ConfigLegend(mapConfig, mapConfig.legend);
            appInfo.mapi = apiMap;

            apiMap.ui._basemaps = new BasemapGroup(configService.getSync.map);

            // Required for FM to function properly
            api.focusManager.addViewer($rootElement, $mdDialog, configService.getSync.ui.fullscreen);
            $rootElement.attr('rv-trap-focus', $rootElement.attr('id'));

            events.$broadcast(events.rvApiPrePlugin, apiMap);

            // allows plugins to compile angular templates through the API
            apiMap.$compile = function(html, useIsolatedScope = true) {
                const scope = $rootScope.$new(useIsolatedScope);
                $compile(html)(scope);
                return scope;
            };

            // allows plugins to register components on the angular instance, usually to provide angular material support
            apiMap.agControllerRegister = $controllerProvider.register;

            // allow access to identify service to the API.
            apiMap._identify = identifyService.identify;

            events.$broadcast(events.rvApiPreMapAdded, apiMap);

            events.$broadcast(events.rvApiMapAdded, apiMap);
            gtm(apiMap);
            api.mapAdded.next(apiMap);
        });

        /**
         * Track mousedown events on the map that start map pan.
         *
         * @function mouseDownHandler
         * @private
         * @param {Event} event mouse down event when the user starts dragging the map
         */
        function mouseDownHandler(event) {
            mouseMoveHanlder = mouseMoveHandlerBuilder(event);
            el.off('mousemove').on('mousemove', mouseMoveHanlder);
        }

        /**
         * Track mousemove events when the map is being panned.
         * This will fire `rvMapPan` event with relative x/y offsets.
         *
         * @function mouseMoveHandlerBuilder
         * @private
         * @param {Event} startingEvent mouse down event when the user starts dragging the map
         * @return {Function} a function handling mouse movements when the user pans the map
         */
        function mouseMoveHandlerBuilder(startingEvent) {
            // TODO: IE is not fast enough to sustain this approach as the mousemove event don't start to fire immediately after mouseover event
            // need to reimplement similar to followmouse tooltip strategy

            let currentPosition = {
                x: startingEvent.clientX,
                y: startingEvent.clientY
            };

            return event => {
                const newPosition = {
                    x: event.clientX,
                    y: event.clientY
                };

                const momevementOffset = {
                    x: currentPosition.x - newPosition.x,
                    y: currentPosition.y - newPosition.y
                };

                $rootScope.$broadcast(events.rvMapPan, momevementOffset);

                currentPosition = newPosition;
            };
        }

        /**
         * Track mousedown events on the map that end map pan.
         *
         * @function mouseUpHandler
         * @private
         */
        function mouseUpHandler() {
            el.off('mousemove', mouseMoveHanlder);
        }
    }

    /**
     * Ensures this directive has focus before any key presses become active. If so
     * registers the key as active and starts animation.
     *
     * @function keyDownHandler
     * @param {Object} event     the keydown/keyup browser event
     */
    function keyDownHandler(event) {
        // prevent arrow keys from scrolling the page
        if (event.which >= 37 && event.which <= 40) {
            event.preventDefault(true);
        }

        if (event.which === 9) {
            // tab key should clear all active keys
            keyMap = [];
            stopAnimate();
        } else if (keyMap.indexOf(event.which) === -1) {
            // enable keyboard support only when map is focused
            if (referenceService.mapNode.is($(document.activeElement))) {
                keyMap.push(event.which);
                animate(event);
            }
        }
    }

    /**
     * Removes the key from keyMap so that it is no longer active
     *
     * @function keyUpHandler
     * @param {Object} event     the keydown/keyup browser event
     */
    function keyUpHandler(event) {
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
    // eslint-disable-next-line complexity
    function animate(event) {
        stopAnimate();

        if (keyMap.length === 0) {
            return;
        }

        // calculate the pan distance of x and y in Point format given some
        // x and y in ScreenPoint format (currently 10). This ensures we pan by some
        // arbitrary constant pixel which won't change with zooming (as opposed to panning by distance)
        let mapPntCntr = mapInstance.extent.getCenter();
        let mapScrnCntr = mapInstance.toScreen(mapPntCntr);
        mapScrnCntr.x += 10;
        mapScrnCntr.y += 10;
        let mapPntHorDiff = Math.abs(mapInstance.toMap(mapScrnCntr).x - mapPntCntr.x);
        let mapPntVertDiff = Math.abs(mapInstance.toMap(mapScrnCntr).y - mapPntCntr.y);

        let x = 0;
        let y = 0;
        let movementMultiplier = 1;
        for (let i = 0; i < keyMap.length; i++) {
            switch (keyMap[i]) {
                // enter key is pressed - trigger identify
                case keyNames.ENTER:
                    // prevent identify if focus manager is in a waiting state since ENTER key is used to activate the focus manager.
                    // Also disable if SHIFT key is depressed so identify is not triggered on leaving focus manager
                    if ($rootElement.attr('rv-focus-status') === api.focusStatusTypes.ACTIVE) {
                        event.mapPoint = mapPntCntr;
                        event.screenPoint = mapScrnCntr;
                        identifyService.identify(event);
                    }
                    break;
                // shift key pressed - pan distance increased
                case keyNames.SHIFT:
                    movementMultiplier = 2;
                    break;
                // ctrl key pressed - pan distance decreased
                case keyNames.CTRL:
                    movementMultiplier = 0.25;
                    break;
                // left arrow key pressed
                case keyNames.LEFT_ARROW:
                    x -= mapPntHorDiff;
                    break;
                // up arrow key pressed
                case keyNames.UP_ARROW:
                    y += mapPntVertDiff;
                    break;
                // right arrow key pressed
                case keyNames.RIGHT_ARROW:
                    x += mapPntHorDiff;
                    break;
                // down arrow key pressed
                case keyNames.DOWN_ARROW:
                    y -= mapPntVertDiff;
                    break;
                // + (plus) key pressed - zoom in
                case keyNames.EQUAL_SIGN:
                    geoService.map.shiftZoom(1);
                    break;
                // + (plus) key pressed - FF and IE
                case keyNames.EQUALS_FIREFOX:
                    geoService.map.shiftZoom(1);
                    break;
                // - (minus) key pressed - zoom out
                case keyNames.DASH:
                    geoService.map.shiftZoom(-1);
                    break;
                // - (minus) key pressed - FF and IE
                case keyNames.MINUS_FIREFOX_MUTE_UNMUTE:
                    geoService.map.shiftZoom(-1);
                    break;
            }
        }

        // continue updating x and y when arrow keys are being held down, but
        // only if one or both are not 0 (holding down left and right arrow will
        // result in x = 0 so no animation is run)
        if (x !== 0 || y !== 0) {
            animationInterval = $interval(() => {
                mapPntCntr.x += movementMultiplier * x;
                mapPntCntr.y += movementMultiplier * y;
                mapInstance.centerAt(mapPntCntr);
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
