/**
 * @module locateService
 * @memberof app.geo
 *
 * @description
 * Tries to determine a users location through the browser. If this fails
 * and there exists a top level property in the config named 'googleAPIKey', then
 * a request to Google's geolocation API is made.
 */
angular
    .module('app.geo')
    .factory('locateService', locateService);

function locateService($http, $translate, gapiService, configService, errorService) {

    let apiURL;
    const location = {};
    const service = {
        find
    };

    // check for the googleAPIkey on every config reload
    configService.onEveryConfigLoad(conf => {
        if (conf.services.googleAPIKey) {
            apiURL = `https://www.googleapis.com/geolocation/v1/geolocate?key=${conf.services.googleAPIKey}`;
        } else {
            apiURL = undefined;
        }
    });

    return service;

    /**
     * Takes a location object in lat/long, converts to current map spatialReference using
     * reprojection method in geoApi, and zooms to the point.
     *
     * @function geolocate
     * @param {Object} location is a location object, containing geometries in lat/long
     */
    function geolocate(location) {
        const map = configService.getSync.map.instance;
        const lods = configService.getSync.map.selectedBasemap.lods;

        // get reprojected point and zoom to it
        const geoPt = gapiService.gapi.proj.localProjectPoint(4326, map.spatialReference.wkid,
            [parseFloat(location.longitude), parseFloat(location.latitude)]);
        const zoomPt = gapiService.gapi.proj.Point(geoPt[0], geoPt[1], map.spatialReference);

        // give preference to the layer closest to a 50k scale ratio which is ideal for zoom
        const sweetLod = gapiService.gapi.Map.findClosestLOD(lods, 50000);
        map.centerAndZoom(zoomPt, Math.max(sweetLod.level, 0));
    }

    /**
     * Pans to the users location if possible, displaying an error message otherwise. The users
     * location is determined only once, and is reused on subsequent requests for performance.
     * @function find
     */
    function find() {
        const onFailedBrowserCB = () =>
            _apiLocate(
                geolocate,
                () => errorService.display({ textContent: $translate.instant('geoLocation.error') })
            );

        if (location.latitude) {
            geolocate(location);
        } else {
            _browserLocate(geolocate, onFailedBrowserCB);
        }
    }

    /**
     * Attempts to find the users location (lat/lng) using built-in browser support.
     * @function _browserLocate
     * @private
     * @param {Function} onSuccess callback function to execute if location was found
     * @param {Function} onFailure callback function to execute if location was not found
     */
    function _browserLocate(onSuccess, onFailure) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                gp => {
                    location.latitude = gp.coords.latitude;
                    location.longitude = gp.coords.longitude;
                    onSuccess(location);
                },
                onFailure
            );
        } else {
            onFailure();
        }
    }

    /**
     * Attempts to find the users location (lat/lng) using Google's geolocation API.
     * @function _apiLocate
     * @private
     * @param {Function} onSuccess callback function to execute if location was found
     * @param {Function} onFailure callback function to execute if location was not found
     */
    function _apiLocate(onSuccess, onFailure) {
        if (typeof apiURL !== 'undefined') {
            $http.post(apiURL).then(apiResponse => {
                geolocate({
                    latitude: apiResponse.data.location.lat,
                    longitude: apiResponse.data.location.lng
                });
            }, onFailure);
        } else {
            onFailure();
        }
    }
}
