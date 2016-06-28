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
            loadWithBookmark
        };

        let bookmarkBlocking = true;

        return service;

        /************************/

        /**
         * Maintains state over projection switch. Updates the config to the current state,
         * sets the new basemap, and then reloads the map.
         *
         * @param {String} basemapId     The id of the basemap to switch to
         */
        function loadNewProjection(basemapId) {
            bookmarkService.updateConfig().then(() => {
                geoService.setSelectedBaseMap(basemapId);
                geoService.assembleMap();
            });
        }

        /**
         * Maintains state over language switch. Gets the current state, switches to the new lang and its config,
         * and then reloads the map.
         *
         * @param {String} lang      The code of the language to switch to
         */
        function loadNewLang(lang) {
            const bookmark = bookmarkService.getBookmark();
            $translate.use(lang);
            configService.getOriginal().then(config => {
                bookmarkService.parseBookmark(bookmark, config);
                geoService.assembleMap();
            });
        }

        function loadWithBookmark(bookmark, initial) {
            if (!initial || bookmarkBlocking) {
                configService.getOriginal().then(config => {
                    bookmarkService.parseBookmark(bookmark, config);

                    if (bookmarkBlocking) {
                        $rootScope.$broadcast(events.rvBookmarkInit);
                        bookmarkBlocking = false;
                    }
                });
            }
        }
    }
})();
