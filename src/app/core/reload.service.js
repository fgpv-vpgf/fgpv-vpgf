/**
 *
 * @name reloadService
 * @module app.core
 *
 * @description reloadService manages state through map reloads
 *
 */
angular
    .module('app.core')
    .factory('reloadService', reloadService);

function reloadService(events, bookmarkService, geoService, configService) {
    const service = {
        // loadNewProjection,
        loadWithExtraKeys,
        bookmarkBlocking: false,

        loadNewLang,
        loadWithBookmark,
        changeProjection,

        reloadConfig
    };

    return service;

    /************************/

    function reloadConfig() {
        events.$broadcast(events.rvApiHalt);

        geoService._isMapReady = false;
        geoService.destroyMap();
        configService.reInitialize();
        geoService.assembleMap();
    }

    function changeProjection(startPoint) {
        events.$broadcast(events.rvApiHalt);
        const bookmark = bookmarkService.getBookmark(startPoint);
        bookmarkService.parseBookmark(bookmark);

        geoService
            .destroyMap()
            .assembleMap();
    }

    /**
     * Maintains state over projection switch. Updates the config to the current state,
     * sets the new basemap, and then reloads the map.
     *
     * @function loadNewProjection
     * @param {String} basemapId     The id of the basemap to switch to
     */
    /*function loadNewProjection(basemapId) {
        events.$broadcast(events.rvApiHalt);
        const bookmark = bookmarkService.getBookmark();

        // get original config and add bookmark to it
        configService.getAsync.then(config => {
            bookmarkService.parseBookmark(bookmark, config, { newBaseMap: basemapId });
            geoService.assembleMap();
        });
    }*/

    /**
     * Maintains state over language switch. Gets the current state, switches to the new lang and its config,
     * and then reloads the map.
     *
     * @function loadNewLang
     * @param {String} lang      The code of the language to switch to
     */
    function loadNewLang(lang) {
        events.$broadcast(events.rvApiHalt);

        const bookmark = bookmarkService.getBookmark();

        geoService.destroyMap();
        configService.setLang(lang);

        configService.getAsync.then(config => {
            bookmarkService.parseBookmark(bookmark);
            geoService.assembleMap();
        });
    }

    /**
     * Applies 'bookmark' to the config and then broadcasts the bookmarkReady event or reloads the map
     *
     * @function loadWithBookmark
     * @param {String} bookmark     The bookmark containing the desired state of the viewer
     * @param {Bool} initial        Whether this call was meant to initialize the viewer
     */
    function loadWithBookmark(bookmark, initial) {
        if (!bookmark) {
            events.$broadcast(events.rvBookmarkInit);
            service.bookmarkBlocking = false;
        } else if (!initial || service.bookmarkBlocking) {
            events.$broadcast(events.rvApiHalt);

            // modify the original config
            configService.getAsync.then(config => {
                bookmarkService.parseBookmark(bookmark);

                if (service.bookmarkBlocking) {
                    // broadcast startup event
                    events.$broadcast(events.rvBookmarkInit);
                    service.bookmarkBlocking = false;
                } else {
                    // loading a bookmark after initialization, reload the map
                    geoService
                        .destroyMap()
                        .assembleMap();
                }
            });
        }
    }

    function loadWithExtraKeys(bookmark, keys) {
        if (service.bookmarkBlocking) {
            events.$broadcast(events.rvApiHalt);
            configService.getAsync.then(config => {
                bookmarkService.parseBookmark(bookmark, config, { newKeyList: keys });

                // broadcast startup event
                events.$broadcast(events.rvBookmarkInit);
                service.bookmarkBlocking = false;
            });
        }

    }
}
