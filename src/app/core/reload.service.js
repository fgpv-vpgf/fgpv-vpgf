(() => {

    /**
     * @ngdoc service
     * @name reloadService
     * @module app.core
     *
     * @description reloadService manages state through map reloads
     *
     */
    angular
        .module('app.core')
        .factory('reloadService', reloadService);

    function reloadService($translate, $rootScope, events, bookmarkService, geoService, configService) {
        const service = {
            loadNewProjection,
            loadNewLang,
            loadWithBookmark,
            loadWithExtraKeys,
            bookmarkBlocking: false
        };

        return service;

        /************************/

        /**
         * Maintains state over projection switch. Updates the config to the current state,
         * sets the new basemap, and then reloads the map.
         *
         * @function loadNewProjection
         * @param {String} basemapId     The id of the basemap to switch to
         */
        function loadNewProjection(basemapId) {
            $rootScope.$broadcast(events.rvApiHalt);
            const bookmark = bookmarkService.getBookmark();

            // get original config and add bookmark to it
            configService.getOriginal().then(config => {
                bookmarkService.parseBookmark(bookmark, config);

                // get current config to modify
                configService.getCurrent().then(currentConfig => {
                    currentConfig.map.initialBasemapId = basemapId;
                    geoService.assembleMap();
                });
            });
        }

        /**
         * Maintains state over language switch. Gets the current state, switches to the new lang and its config,
         * and then reloads the map.
         *
         * @function loadNewLang
         * @param {String} lang      The code of the language to switch to
         */
        function loadNewLang(lang) {
            $rootScope.$broadcast(events.rvApiHalt);
            const bookmark = bookmarkService.getBookmark();
            $translate.use(lang);
            configService.getOriginal().then(config => {
                bookmarkService.parseBookmark(bookmark, config);
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
                $rootScope.$broadcast(events.rvBookmarkInit);
                service.bookmarkBlocking = false;
            } else if (!initial || service.bookmarkBlocking) {
                $rootScope.$broadcast(events.rvApiHalt);

                // modify the original config
                configService.getOriginal().then(config => {
                    bookmarkService.parseBookmark(bookmark, config);

                    if (service.bookmarkBlocking) {
                        // broadcast startup event
                        $rootScope.$broadcast(events.rvBookmarkInit);
                        service.bookmarkBlocking = false;
                    } else {
                        // loading a bookmark after initialization, reload the map
                        geoService.assembleMap();
                    }
                });
            }
        }

        function loadWithExtraKeys(bookmark, keys) {
            if (service.bookmarkBlocking) {
                $rootScope.$broadcast(events.rvApiHalt);
                configService.getOriginal().then(config => {
                    bookmarkService.parseBookmark(bookmark, config, keys);

                    // broadcast startup event
                    $rootScope.$broadcast(events.rvBookmarkInit);
                    service.bookmarkBlocking = false;
                });
            }

        }
    }
})();
