angular
    .module('app.core')
    .factory('reloadService', reloadService);

function reloadService($translate, bookmarkService, geoService, configService) {
    const service = {
        loadNewProjection,
        loadNewLang
    };

    return service;

    /************************/

    function loadNewProjection(basemapId) {
        bookmarkService.updateConfig();
        geoService.setSelectedBaseMap(basemapId);
        geoService.assembleMap();
    }

    function loadNewLang(lang) {
        const bookmark = bookmarkService.getBookmark();
        $translate.use(lang);
        configService.getCurrent(config => {
            bookmarkService.parseBookmark(bookmark, config);
        });
        geoService.assembleMap();
    }
}
