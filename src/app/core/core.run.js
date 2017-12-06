angular
    .module('app.core')
    .run(debugBlock)
    .run(apiBlock)
    .run(runBlock);

/**
 * @function runBlock
 * @private
 * @memberof app.core
 * @description
 *
 * The `runBlock` triggers config and locale file loading, sets language of the app.
 */
function runBlock($rootScope, $rootElement, $q, globalRegistry, reloadService, events, configService,
    gapiService, appInfo) {

    const promises = [
        configService.initialize(),
        gapiService.isReady
    ];

    // wait on the config and geoapi
    $q.all(promises)
        .then(() => {
            readyDelay();
        })
        .catch(reason => {
            RV.logger.error('runBlock', 'fatal error', reason);
        });

    $rootScope.uid = uid;

    /********************/

    /**
     * Waits on bookmark to modify the config if needed
     *
     * @function readyDelay
     * @private
     */
    function readyDelay() {
        const waitAttr = $rootElement.attr('rv-wait');

        preLoadApiBlock();

        if (typeof waitAttr !== 'undefined') {
            reloadService.bookmarkBlocking = true;
            const deRegister = $rootScope.$on(events.rvBookmarkInit, () => {
                $rootScope.$broadcast(events.rvReady);
                deRegister(); // de-register `rvBookmarkInit` listener to prevent broadcasting `rvReady` in the future
            });
        } else {
            $rootScope.$broadcast(events.rvReady);
        }
    }

    /**
     * Allows API calls to be exposed before map creation
     *
     * @function preLoadApiBlock
     * @private
     */
    function preLoadApiBlock() {
        const preMapService = {
            initialBookmark,
            restoreSession,
            start
        };

        if (globalRegistry.getMap(appInfo.id)) {
            globalRegistry.getMap(appInfo.id)._registerPreLoadApi(preMapService);
        }

        /******************/

        /**
         * Loads using a bookmark
         *
         * @function initialBookmark
         * @param {String} bookmark      bookmark containing viewer state
         */
        function initialBookmark(bookmark) {
            const storage = sessionStorage.getItem(appInfo.id);
            if (storage) {
                sessionStorage.removeItem(appInfo.id);
            }

            reloadService.loadWithBookmark(bookmark, true);
        }

        /**
         * Loads using a bookmark from sessionStorage (if found) and a keyList
         *
         * @function restoreSession
         * @param {Array} keys      list of keys to load with
         */
        function restoreSession(keys) {
            const bookmark = sessionStorage.getItem(appInfo.id);

            if (bookmark) {
                reloadService.loadWithExtraKeys(bookmark, keys);
                sessionStorage.removeItem(appInfo.id);
            } else {
                if (globalRegistry.getMap(appInfo.id)) {
                    globalRegistry.getMap(appInfo.id).loadRcsLayers(keys);
                }
                start();
            }
        }

        /**
         * Bypasses the rv-wait block
         *
         * @function start
         */
        function start() {
            RV.logger.log('preLoadApiBlock', 'bypassing *rv-wait*');
            reloadService.bookmarkBlocking = false;
            $rootScope.$broadcast(events.rvBookmarkInit);
        }

    }

    /**
     * A helper function to create ids for template elements inside directives.
     * Should be called with a scope id and an optional suffix if several different ids needed inside a single directive (each scope has a different id).
     * Adding `{{ ::$root.uid($id) }}` inside a template will return a `{appid}-{scopeid}` string. If this used several times inside a single template, the same id is returned, so you don't have to store it to reuse. Don't forget a one-time binding.
     * @function uid
     * @private
     * @param {String|Number} id ui element id
     * @param {String|Number} [suffix] an optional suffix to be appended to the resulting id
     * @return {String} generated template element id
     */
    function uid(id, suffix) {
        suffix = suffix ? `-${suffix}` : '';
        return `${appInfo.id}-id-${id}${suffix}`;
    }
}

/**
 * @function apiBlock
 * @private
 * @memberof app.core
 * @description
 *
 * `apiBlock` sets up language and RCS calls for the global API
 */
function apiBlock($rootScope, globalRegistry, geoService, configService, events,
    LayerBlueprint, bookmarkService, gapiService, reloadService, appInfo, $rootElement,
    $mdDialog, pluginService, mapToolService, $mdSidenav) {

    const service = {
        setLanguage,
        getCurrentLang,
        loadRcsLayers,
        resetMap,
        getBookmark,
        centerAndZoom,
        useBookmark,
        getRcsLayerIDs: () => geoService.getRcsLayerIDs(),
        appInfo,
        registerPlugin: function () {
            pluginService.register(...arguments, this);
        },
        northArrow: mapToolService.northArrow,
        mapCoordinates: mapToolService.mapCoordinates,
        getMapClickInfo: mapToolService.getMapClickInfo,
        convertDDToDMS: mapToolService.convertDDToDMS,
        setMapCursor,
        projectGeometry,
        toggleSideNav: val => { $mdSidenav('left')[val](); },
        openDialogInfo: options => { pluginService.openDialogInfo(options); },
        reInitialize: bookmark => reloadService.reloadConfig(bookmark)
    };

    // Attaches a promise to the appRegistry which resolves with apiService
    if (globalRegistry.getMap(appInfo.id)) {
        $rootScope.$on(events.rvApiReady, () => {
            globalRegistry.getMap(appInfo.id)._registerMap(service); // this enables the main API
            globalRegistry.getMap(appInfo.id)._applicationLoaded(service); // this triggers once
            RV.logger.log('apiBlock', `registered viewer with id *${appInfo.id}*`);

            globalRegistry.focusManager.addViewer($rootElement, $mdDialog, configService.getSync.ui.fullscreen);
        });

        $rootScope.$on(events.rvApiHalt, () => {

            globalRegistry.getMap(appInfo.id)._deregisterMap();
        });
    }

    /**
     * Sets the translation language and reloads the map
     *
     * @memberof app.core
     * @function
     * @inner
     * @param {String}  lang    the language to switch to
     */
    function setLanguage(lang) {
        reloadService.loadNewLang(lang);
    }

    /**
     * Get current language
     *
     * @function getCurrentLang
     */
    function getCurrentLang() {
        return configService.getSync.language;
    }

    /**
     * Load RCS layers after the map has been instantiated
     *
     * @memberof app.core
     * @function
     * @inner
     * @param {Array}  keys  array of RCS keys (String) to be added
     */
    function loadRcsLayers(keys) {
        // trigger RCS web call
        configService.rcsAddKeys(keys);
    }

    /**
     * Reset the map by removing all layers after the map has been instantiated
     *
     * @memberof app.core
     * @function
     * @inner
     */
    function resetMap() {
        configService.resetMap();
    }

    /**
     * Retrieves a bookmark for the current state
     *
     * @function getBookmark
     * @returns {String}    The bookmark containing the state of the viewer
     */
    function getBookmark() {
        return bookmarkService.getBookmark();
    }

    /**
     * Updates the map using bookmark. If initial is set, will only be used if its the first call to be received.
     *
     * @function useBookmark
     * @param {String} bookmark     The bookmark containing the desired state of the viewer
     */
    function useBookmark(bookmark) {
        reloadService.loadWithBookmark(bookmark, false);
    }

    /**
     * Updates the extent of the map.
     *
     * @function centerAndZoom
     * @param {Array}  x                    The x coord to center on
     * @param {Number} y                    The y coord to center on
     * @param {Object} spatialReference     The spatial Reference for the coordinates
     * @param {Number} zoom                 The level to zoom to
     */
    function centerAndZoom(x, y, spatialReference, zoom) {
        const coords = gapiService.gapi.proj.localProjectPoint(
            spatialReference, geoService.mapObject.spatialReference, { x: x, y: y }
        );
        const zoomPoint = gapiService.gapi.proj.Point(coords.x, coords.y, geoService.mapObject.spatialReference);

        // separate zoom and center calls, calling centerAndZoom sets the map to an extent made up of NaN
        configService.getSync.map.instance.setZoom(zoom);
        configService.getSync.map.instance.centerAt(zoomPoint);
    }

    /**
     * Set map cursor.
     *
     * @function setMapCursor
     * @param {String} cursor     The to set
     */
    function setMapCursor(cursor) {
        geoService.map.setMapCursor(cursor);
    }

    /**
     * Project a geometry
     *
     * @function projectGeometry
     * @param {Object} geometry     The geometry to project
     * @param {Number} outSR        The output spatial reference ID
     * @return {Object}             The projected geometry
     */
    function projectGeometry(geometry, outSR) {
        return gapiService.gapi.proj.localProjectGeometry(outSR, geometry);
    }
}

/**
 * @function debugBlock
 * @private
 * @memberof app.core
 * @description
 *
 * Exposes inner services for debugging purposes
 */
function debugBlock($rootElement, appInfo, geoService) {
    // store app id in a value
    appInfo.id = $rootElement.attr('id');

    // expose guts for debug purposes
    angular.extend(window.RV.debug[appInfo.id] || {}, {
        geoService
    });
}
