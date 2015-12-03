'use strict';
var basemap = require('./basemap.js');

module.exports = function (esriBundle) {
    var mapManager = {};

    mapManager.setupMap = function (map, settings) {

        // var map = arguments[0];
        // var settings = arguments[1];

        var lbasemap = basemap(esriBundle);

        return lbasemap.makeBasemaps(settings.basemaps, map, 'anchorId');
    };

    return mapManager;
};
