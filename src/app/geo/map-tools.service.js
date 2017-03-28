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

    function mapToolService(geoService, gapiService) {

        const service = {
            northArrow
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
    }

})();
