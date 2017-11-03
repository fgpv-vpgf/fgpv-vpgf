import Map from 'api/map';

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

function rvInitMap($rootScope, geoService, events, referenceService, $rootElement, $interval, globalRegistry, identifyService, appInfo, gapiService) {

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

            // reduce map animation time which in turn makes panning less jittery
            mapInstance.mapDefault('panDuration', 0);
            mapInstance.mapDefault('panRate', 0);

            el
                .off('keydown', keyDownHandler)
                .off('keyup', keyUpHandler)
                .off('mousedown', mouseDownHandler)
                .off('mouseup', mouseUpHandler)

                .on('keydown', keyDownHandler)
                .on('keyup', keyUpHandler)
                .on('mousedown', mouseDownHandler)
                .on('mouseup', mouseUpHandler);

                // API related initialization ------------------
                window.RZ.GAPI = window.RZ.GAPI ? window.RZ.GAPI : gapiService.gapi;
                const apiMap = new Map($rootElement);
                apiMap.fgpMap = mapInstance;
                appInfo.apiMap = apiMap;
                loadExtensions(apiMap);
                window.RZ.mapAdded.next(apiMap);

                events.$broadcast(events.rvApiMapAdded, apiMap);
        });

        /**
         * Fetches any `rv-extensions` scripts and evals them with the api map instance scoped in.

         * @param {Object} apiMap the api map instance
         */
        function loadExtensions(apiMap) {
            const rvextensions = $rootElement.attr('rv-extensions');
            const extensionList = rvextensions ? rvextensions.split(',') : [];

            extensionList.forEach(url => {
                $.ajax({method: 'GET', dataType: 'text', url})
                    .then(data => eval(`(function(mapInstance) { ${data} })(apiMap);`));
            });
        }

        /**
         * Track mousedown events on the map that start map pan.
         *
         * @function mouseDownHandler
         * @private
         * @param {Event} event mouse down event when the user starts dragging the map
         */
        function mouseDownHandler(event) {
            mouseMoveHanlder = mouseMoveHandlerBuilder(event);
            el
                .off('mousemove')
                .on('mousemove', mouseMoveHanlder);
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

        if (event.which === 9) { // tab key should clear all active keys
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
    function animate() {
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
                    identifyService.identify(event);
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
                geoService.map.shiftZoom(1);
                break;
            // + (plus) key pressed - FF and IE
            case 61:
                geoService.map.shiftZoom(1);
                break;
            // - (minus) key pressed - zoom out
            case 189:
                geoService.map.shiftZoom(-1);
                break;
            // - (minus) key pressed - FF and IE
            case 173:
                geoService.map.shiftZoom(-1);
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
