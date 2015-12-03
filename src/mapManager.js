'use strict';

module.exports = function () {
    var mapManager = {};

    mapManager.setupMap = function () {
        var map = arguments[0];
        var settings = arguments[1];
        var geoApi = arguments[2];

        return geoApi.basemap.makeBasemaps(settings.basemaps, map, 'anchorId');
    };

    return mapManager;
};
