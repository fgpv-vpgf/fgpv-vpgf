(() => {
    /**
     * @module mapToolService
     * @memberof app.geo
     *
     * @description
     * Provides a variety of map data for  internal or API use such as the north arrow.
     */
    angular
        .module('app.geo')
        .factory('mapToolService', mapToolService);

    function mapToolService(geoService, gapiService, $translate) {

        const service = {
            northArrow,
            mapCoordinates
        };

        // get values once to reuse in private functions (cardinal points and degree symbol)
        // need to set in function because $translate.instant does not work at this point
        const cardinal = {
            deg: String.fromCharCode(176)
        };

        return service;

        /**
        * Provides data needed for the display of a north arrow on the map for lambert and mercator projections. All other projections
        * are not supported, however mapPntCntr and mapScrnCntr are still returned so that if needed, external API's can be created for
        * any projection type.
        *
        * The returned object has the following properties:
        *    projectionSupported    {boolean}   true iff current projection is lambert or mercator
        *    screenX                {Number}    left offset for arrow to intersect line between map center and north point
        *    angleDegrees           {Number}    angle derived from intersection of horizontal axis line with line between map center and north point
        *    rotationAngle          {Number}    number of degrees to rotate north arrow, 0 being none with heading due north
        *    mapPntCntr             {Object}    lat/lng of center in current extent
        *    mapScrnCntr            {Object}    pixel x,y of center in current extent
        *
        * @function  northArrow
        * @returns  {Object}    an object containing data needed for either static or moving north arrows
        */
        function northArrow() {
            const map = geoService.mapObject;
            const mapPntCntr = map.extent.getCenter();
            const mapScrnCntr = map.toScreen(mapPntCntr);
            const wkid = map.spatialReference.wkid;

            let screenX = null;
            let screenY = null;
            let angleDegrees = null;
            let rotationAngle = null;

            if (wkid === 102100) { // mercator
                // always in center of viewer with no rotation
                screenX = mapScrnCntr.x;
                rotationAngle = 0;

            } else {
                // getNorthArrowAngle uses 180 degrees as north but here we expect 90 degrees to be north, so we correct the rotation by the subtraction
                angleDegrees = 270 - gapiService.gapi.mapManager.getNorthArrowAngle(map);
                // since 90 degree is north, any deviation from this is the rotation angle
                rotationAngle =  90 - angleDegrees;
                // z is the hypotenuse line from center point to the top of the viewer. The triangle is always a right triangle
                const z = mapScrnCntr.y / Math.sin(angleDegrees * 0.01745329252); // 0.01745329252 is the radian conversion
                // hard code north pole so that arrow does not continue pointing past it
                const northPoint = gapiService.gapi.proj.localProjectPoint('EPSG:4326', map.spatialReference,
                    { x: -96, y: 90 });
                const screenNorthPoint = map.toScreen(northPoint);
                screenY = screenNorthPoint.y;
                // the would be the bottom of our triangle, the length from center to where the arrow should be placed
                screenX = screenY < 0 ?
                    mapScrnCntr.x + (Math.sin((90 - angleDegrees) * 0.01745329252) * z) :
                    screenNorthPoint.x;
            }

            return {
                projectionSupported: screenX !== null,
                screenX,
                screenY,
                angleDegrees,
                rotationAngle,
                mapPntCntr,
                mapScrnCntr
            };
        }

        /**
        * Provides data needed for the display of a map coordinates on the map in latitude/longitude (degree, minute, second and decimal degree).
        *
        * The returned object has the following properties:
        *    dms                {Number}    lat/long in degree, minute, second
        *    decimal           {Number}    lat/long in decimal degree
        *
        * @function  mapCoordinates
        * @param {Object} point point in map coordinate to project and get lat/long from
        * @returns  {Object}    an object containing data needed for map coordinates
        */
        function mapCoordinates(point) {
            // project point in lat/long
            const coord = gapiService.gapi.proj.localProjectGeometry(4326, point);

            // get values once to reuse in private functions (cardinal points and degree symbol)
            if (typeof cardinal.east === 'undefined') {
                cardinal.east = $translate.instant('geo.coord.east');
                cardinal.west = $translate.instant('geo.coord.west');
                cardinal.north = $translate.instant('geo.coord.north');
                cardinal.south = $translate.instant('geo.coord.south');
            }

            // degree, minute, second
            const dmsCoords = convertDDToDMS(coord.y, coord.x);
            const dms = `${dmsCoords.y} | ${dmsCoords.x}`;

            // decimal
            coord.y = coord.y.toFixed(5);
            coord.x = coord.x.toFixed(5);
            coord.y = (coord.y > 0) ? `${coord.y} ${cardinal.north}` : `${Math.abs(coord.y)} ${cardinal.south}`;
            coord.x = (coord.x < 0) ? `${Math.abs(coord.x)} ${cardinal.west}` : `${coord.x} ${cardinal.east}`;
            const decimal = `${coord.y} | ${coord.x}`;

            return { dms, decimal };
        }

        /**
        * Convert lat/long in decimal degree to degree, minute, second.
        *
        * @function convertDDToDMS
        * @private
        * @param {Number} lat latitude value
        * @param {Number} long longitude value
        * @return {Object} object who contain lat/long in degree, minute, second
        */
        function convertDDToDMS(lat, long) {
            const oy = (lat > 0) ? cardinal.north : cardinal.south;
            const dy = Math.floor(lat);
            const my = Math.floor((lat - dy) * 60);
            const sy = Math.round((lat - dy - my / 60) * 3600);

            const ox = (long < 0) ? cardinal.west : cardinal.east;
            const dx = Math.floor(long);
            const mx = Math.floor((long - dx) * 60);
            const sx = Math.round((long - dx - mx / 60) * 3600);

            return { y: `${Math.abs(dy)}${cardinal.deg} ${padZero(my)}\' ${padZero(sy)}\" ${oy}`,
                    x: `${Math.abs(dx)}${cardinal.deg} ${padZero(mx)}\' ${padZero(sx)}\" ${ox}` };
        }

        /**
        * Pad value with leading 0 to make sure there is always 2 digits if number is below 10.
        *
        * @function padZero
        * @private
        * @param {Number} val value to pad with 0
        * @return {String} string with always 2 characters
        */
        function padZero(val) {
            return (val >= 10) ? `${val}` : `0${val}`;
        }
    }

})();
