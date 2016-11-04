'use strict';
const basemap = require('./basemap.js');

/**
  * @ngdoc module
  * @name mapManager
  * @description
  *
  * The `MapManager` module exports an object with the following properties:
  * - `Extent` {type} of esri/geometry
  * - `Map` {type} of esri/map
  * - `OverviewMap` {type} of esri/dijit/OverviewMap
  * - `Scalebar` {type} of esri/dijit/Scalebar
  * - `getExtentFromSetting {function} create an ESRI Extent object from extent setting JSON object.
  * - `setupMap` {function} interates over config settings and apply logic for any items present.
  * - `setProxy` {function} Set proxy service URL to avoid same origin issues
  */

// mapManager module, provides function to setup a map
module.exports = function (esriBundle, geoApi) {
    // note: a decision was made to include esri/dijit/Scalebar here because
    // it has minimum interaction after creation, no need for the additional
    // scalebar.js
    const mapManager = {
        Extent: esriBundle.Extent,
        Map: esriBundle.Map,
        OverviewMap: esriBundle.OverviewMap,
        Scalebar: esriBundle.Scalebar,
        getExtentFromJson,
        setupMap,
        setProxy,
        mapDefault,
        findClosestLOD,
        getNorthArrowAngle,
        getScaleRatio,
        checkBoundary
    };

    let basemapCtrl;
    let scalebarCtrl;
    let overviewMapCtrl;

    /**
     * @ngdoc method
     * @name setupMap
     * @memberof mapManager
     * @description
     * Setup map features with info provided by configuration
     * <div>
     * -- Demo: The follwoing is from description section of ngDoc --
     *
     * <h4>TODO</h4>
     * <p>Rename BasemapControl and ScalebarControl</p>
     * -- End of description section --
     * </div>
     *
     * @param {esriMap} map ESRI map object
     * @param {Object} settings JSON object of map configurations
     * @return {Object} with following properties:
     * <ul>
     *    <li>BasemapControl - an object with setBasemap function and a BasemapGallery object</li>
     *    <li>OverviewMapControl - a reference to the overviewMap control on the map</li>
     *    <li>ScalebarControl - a reference to the scalebar control on the map</li>
     * </ul>
     */
    function setupMap(map, settings) {

        // check to see if property exists in settings
        if (settings.basemaps) {

            // need to pass esriBundle to basemap module in order to use it
            // the alternative is to pass geoApi reference after creation, and then use the geoApi to
            // access the properly initialized modules.
            // or Is there an other way to do it?
            const lbasemap = basemap(esriBundle);

            // basemapCtrl is a basemap gallery object, should store this value for application use
            basemapCtrl = lbasemap.makeBasemaps(settings.basemaps, map);
        } else {
            console.warn('warning: basemaps setting does not exist');
        }

        // TODO: add code to setup scalebar
        if (settings.scalebar) {

            scalebarCtrl = new mapManager.Scalebar({
                map: map,
                attachTo: settings.scalebar.attachTo,
                scalebarUnit: settings.scalebar.scalebarUnit
            });

            scalebarCtrl.show();

        } else {
            console.warn('scalebar setting does not exists');
        }

        // TODO: add code to setup north arrow

        // Setup overview map
        if (settings.overviewMap && settings.overviewMap.enabled) {
            if (overviewMapCtrl) {
                overviewMapCtrl.destroy();
                overviewMapCtrl = null;
            }

            overviewMapCtrl = mapManager.OverviewMap({
                map: map,
                expandFactor: 1,
                visible: settings.overviewMap.enabled
            });

            overviewMapCtrl.startup();

            basemapCtrl.basemapGallery.on('selection-change', () => {
                overviewMapCtrl.destroy();

                overviewMapCtrl = mapManager.OverviewMap({
                    map: map,
                    expandFactor: 1,
                    visible: settings.overviewMap.enabled
                });

                overviewMapCtrl.startup();
            });

        } else {
            console.warn('overviewMap setting does not exist, or it\'s visible' +
                ' setting is set to false.');
        }

        // TODO: add code to setup mouse co-ordinates

        // return as object so we can use this in our geo section of fgpv
        return {
            BasemapControl: basemapCtrl,
            OverviewMapControl: overviewMapCtrl,
            ScalebarControl: scalebarCtrl
        };
    }

    /**
     * @ngdoc method
     * @name setProxy
     * @memberof mapManager
     * @description
     * Set proxy service URL to avoid same origin issues
     *
     * @param {string} proxyUrl should point to a proxy with an interface compatible with ESRI's resource proxy
     */
    function setProxy(proxyUrl) {
        esriBundle.esriConfig.defaults.io.proxyUrl = proxyUrl;
    }

    /**
     * @ngdoc method
     * @name mapDefault
     * @memberof mapManager
     * @description
     * Sets or gets map default config values.
     *
     * @param {String} key name of the default property
     * @param {Any} value value to set for the specified default property
     */
    function mapDefault(key, value) {
        if (typeof value === 'undefined') {
            return esriBundle.esriConfig.defaults.map[key];
        } else {
            esriBundle.esriConfig.defaults.map[key] = value;
        }
    }

    /**
     * @ngdoc method
     * @name getExtentFromJson
     * @memberof mapManager
     * @description
     * create an ESRI Extent object from extent setting JSON object.
     *
     * @param {object} extentJson that follows config spec
     */
    function getExtentFromJson(extentJson) {

        return esriBundle.Extent({ xmin: extentJson.xmin, ymin: extentJson.ymin,
            xmax: extentJson.xmax, ymax: extentJson.ymax,
            spatialReference: { wkid: extentJson.spatialReference.wkid } });
    }

    /**
     * @ngdoc method
     * @name findClosestLOD
     * @memberof mapManager
     * Finds the level of detail closest to the provided scale.
     *
     * @param  {Array} lods     list of levels of detail objects
     * @param  {Number} scale   scale value to search for in the levels of detail
     * @return {Object} the level of detail object closest to the scale
     */
    function findClosestLOD(lods, scale) {
        const diffs = lods.map(lod => Math.abs(lod.scale - scale));
        const lodIdx = diffs.indexOf(Math.min(...diffs));
        return lods[lodIdx];
    }

    /**
     * Calculate north arrow bearing. Angle returned is to to rotate north arrow image.
     * http://www.movable-type.co.uk/scripts/latlong.html
     * @function getNorthArrowAngle
     * @param  {Object} map     map object
     * @returns {Number} map rotation angle (in degree)
     */
    function getNorthArrowAngle(map) {
        // get center point in longitude and use bottom value for latitude
        const pointB = geoApi.proj.localProjectPoint(map.spatialReference, 'EPSG:4326',
                { x: (map.extent.xmin + map.extent.xmax) / 2, y: map.extent.ymin });

        // north value (set longitude to be half of Canada extent (141° W, 52° W))
        const pointA = { x: -96, y: 90 };

        // set info on longitude and latitude
        const dLon = (pointB.x - pointA.x) * Math.PI / 180;
        const lat1 = pointA.y * Math.PI / 180;
        const lat2 = pointB.y * Math.PI / 180;

        // calculate bearing
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = Math.atan2(y, x) * 180 / Math.PI;

        // return angle (180 is pointiong north)
        return ((bearing + 360) % 360).toFixed(1);
    }

    /**
     * Calculate distance between min and max extent to know the pixel ratio between
     * screen size and earth distance.
     * http://www.movable-type.co.uk/scripts/latlong.html
     * @function getScaleRatio
     * @param  {Object} map     map object
     * @param {Number} mapWidth optional the map width to use to calculate ratio
     * @returns {Object} contain information about the scale
     *                               - distance: distance between min and max extentId
     *                               - ratio: measure for 1 pixel in earth distance
     *                               - units: array of units [metric, imperial]
     */
    function getScaleRatio(map, mapWidth = 0) {
        // get left and right maximum value point to calculate distance from
        const pointA = geoApi.proj.localProjectPoint(map.spatialReference, 'EPSG:4326',
                { x: map.extent.xmin, y: (map.extent.ymin + map.extent.ymax) / 2 });
        const pointB = geoApi.proj.localProjectPoint(map.spatialReference, 'EPSG:4326',
                { x: map.extent.xmax, y: (map.extent.ymin + map.extent.ymax) / 2 });

        // Haversine formula to calculate distance
        const R = 6371e3; // earth radius in meters
        const rad = Math.PI / 180;
        const phy1 = pointA.y * rad; // radiant
        const phy2 = pointB.y * rad; // radiant
        const deltaPhy = (pointB.y - pointA.y) * rad; // radiant
        const deltaLambda = (pointB.x - pointA.x) * rad; // radiant

        const a = Math.sin(deltaPhy / 2) * Math.sin(deltaPhy / 2) +
                    Math.cos(phy1) * Math.cos(phy2) *
                    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = (R * c);

        // set map / image width (if mapWidth = 0, use map.width)
        const width = mapWidth ? mapWidth : map.width;

        // get unit from distance, set distance and ratio (earth size for 1 pixel)
        const units = [(d > 1000) ? 'km' : 'm', (d > 1600) ? 'mi' : 'ft'];
        const distance = (d > 1000) ? d / 1000 : d;
        const ratio = distance / width;

        return { distance, ratio, units };
    }

    /*
     * @ngdoc method
     * @name checkBoundary
     * @memberof mapManager
     * Checks if the given extent is outside of the maximum extent. If it is,
     * also provides an adjusted extent that is inside the maximum extent
     *
     * @param {Object} extent      an ESRI extent to test
     * @param {Object} maxExtent   an ESRI extent indicating the boundary of the map
     * @return {Object}            an object with two properties. adjusted - boolean, true if extent was adjusted. newExtent - object, adjusted ESRI extent
     */
    function checkBoundary(extent, maxExtent) {
        // clone extent
        const newExtent = esriBundle.Extent(extent.toJson());
        let flag = false;

        // determine dimensions of adjusted extent.
        // same as input, unless input is so large it consumes max.
        // in that case, we shrink to the max. This avoids the "washing machine"
        // bug where we over-correct past the valid range,
        // and achieve infinite oscillating pans
        const height = Math.min(extent.getHeight(), maxExtent.getHeight());
        const width = Math.min(extent.getWidth(), maxExtent.getWidth());
        const center = extent.getCenter();

        // test if the center of our extent is outside of the boundary
        if (center.y > maxExtent.ymax) {
            newExtent.ymax = maxExtent.ymax;
            newExtent.ymin = maxExtent.ymax - height;
            flag = true;
        } else if (center.y < maxExtent.ymin) {
            newExtent.ymin = maxExtent.ymin;
            newExtent.ymax = maxExtent.ymin + height;
            flag = true;
        }

        if (center.x > maxExtent.xmax) {
            newExtent.xmax = maxExtent.xmax;
            newExtent.xmin = maxExtent.xmax - width;
            flag = true;
        } else if (center.x < maxExtent.xmin) {
            newExtent.xmin = maxExtent.xmin;
            newExtent.xmax = maxExtent.xmin + width;
            flag = true;
        }

        return {
            newExtent,
            adjusted: flag
        };
    }

    return mapManager;
};
