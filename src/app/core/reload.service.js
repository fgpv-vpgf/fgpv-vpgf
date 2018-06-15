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

function reloadService(events, bookmarkService, geoService, configService, stateManager, exportService) {
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

    /**
     * Reload the new config file  and destroy old map and assemble a new Map
     * the map using the new configs
     * @function  reloadConfig
     * @param {String} bookmark     The new bookmark when config is reloaded
     */
    function reloadConfig(bookmark) {
        events.$broadcast(events.rvApiHalt);

        _closeOpenPanels();

        exportService.close();

        geoService._isMapReady = false;
        geoService.destroyMap();
        bookmarkService.emptyStoredBookmark();
        bookmarkService.emptyOrderdBookmarkIds();
        configService.reInitialize();

        if (!bookmark) {
            geoService.assembleMap();
            return;
        }

        // modify the original config
        configService.getAsync.then(config => {
            bookmarkService.parseBookmark(bookmark);

            // loading a bookmark after initialization, reload the map
            geoService.assembleMap();
        });
    }

    function changeProjection(startPoint) {
        events.$broadcast(events.rvApiHalt);

        _closeOpenPanels();

        const bookmark = bookmarkService.getBookmark(startPoint);
        bookmarkService.parseBookmark(bookmark);

        geoService
            .destroyMap()
            .assembleMap();

        events.$broadcast(events.rvProjectiontChanged);
    }

    /**
     * Maintains state over language switch. Gets the current state, switches to the new lang and its config,
     * and then reloads the map.
     *
     * @function loadNewLang
     * @param {String} lang      The code of the language to switch to
     */
    function loadNewLang(lang) {
        events.$broadcast(events.rvApiHalt);

        _closeOpenPanels();

        const bookmark = bookmarkService.getBookmark();

        geoService.destroyMap();
        configService.setLang(lang);

        configService.getAsync.then(config => {
            bookmarkService.parseBookmark(bookmark);
            bookmarkService.adjustRcsLanguage(lang);
            geoService.assembleMap();
        });

        events.$broadcast(events.rvLanguageChanged);
    }

    /**
     * Applies 'bookmark' to the config and then broadcasts the bookmarkReady event or reloads the map
     *
     * @function loadWithBookmark
     * @param {String} bookmark         The bookmark containing the desired state of the viewer
     * @param {Bool} initial            Whether this call was meant to initialize the viewer
     * @param {Array} [additionalKeys]  List of new RCS keys that may differ from the content of the bookmark
     */
    function loadWithBookmark(bookmark, initial, additionalKeys = []) {
        if (!bookmark) {
            events.$broadcast(events.rvBookmarkInit);
            _closeOpenPanels();
            service.bookmarkBlocking = false;
        } else if (!initial || service.bookmarkBlocking) {
            events.$broadcast(events.rvApiHalt);
            events.$broadcast(events.rvBookmarkDetected);
            _closeOpenPanels();

            // FIXME / TODO I think we need more analysis here for what happens if
            // this is not the initial bookmark and there are RCS layers involved.
            // Our config will have the RCS layers from the initial load in it.
            // But then we will attempt to reload.
            // The simple situation is just skip the RCS reloading if !initial.
            // But if incoming bookmark has NEW RCS layers, we need to load those.
            // This might also be related to the Back To Cart case; we might be able
            // to steal some of that logic / mess with additionalKeys param

            // modify the original config
            configService.getAsync.then(config => {
                bookmarkService.parseBookmark(bookmark);

                // remove any rcs definitions from the bookmark so the map doesn't
                // attempt to unbookmark something that doesn't exist in the real
                // config yet.
                let rcsLayers = bookmarkService.extractRcsLayers();

                if (additionalKeys.length > 0) {
                    // toss any items that are not in additionalKeys
                    rcsLayers = rcsLayers.filter(rcsL => additionalKeys.indexOf(rcsL.id.split('.')[1]) > -1);
                }

                if (rcsLayers.length > 0) {
                    // wait for map to be ready, then trigger the rcs load.
                    const mapLoadListener = events.$on(events.rvApiReady, () => {
                        mapLoadListener(); // only react once

                        let keys;

                        if (additionalKeys.length > 0) {
                            // use what was requested
                            keys = additionalKeys;
                        } else {
                            // grab the native rcs key (layer ids are in form rcs.nativeKey.lang) from bookmark
                            keys = rcsLayers.map(rcsL => rcsL.id.split('.')[1]);
                        }

                        // shove the rcs layers back in the bookmark so that info is available when
                        // the results are processed
                        bookmarkService.insertRcsLayers(rcsLayers);

                        // trigger rcs download
                        configService.rcsAddKeys(keys);
                    });
                }

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

    /**
     * Handles the Back-to-Cart scenario. User has left the map page, re-adjusted their cart,
     * and now has returned.
     * Trigger process to apply the cached bookmark and adjust based on new RCS keys
     *
     * @function loadWithBookmark
     * @param {String} bookmark     The bookmark containing the desired state of the viewer
     * @param {Array} keys          List of new RCS keys that may differ from the content of the bookmark
     */
    function loadWithExtraKeys(bookmark, keys) {
        // TODO if we find this blocking check is redundant, we can get rid of
        //      this function and just call loadWithBookmark directly
        if (service.bookmarkBlocking) {
            loadWithBookmark(bookmark, true, keys);
        }
    }

    /**
     * Closes open settings or datatable panels when re-loading configs.
     *
     * @function _closeOpenPanels
     * @private
     */
    function _closeOpenPanels() {
        stateManager.setActive({
            side: false
        }, {
            table: false
        });
    }
}
