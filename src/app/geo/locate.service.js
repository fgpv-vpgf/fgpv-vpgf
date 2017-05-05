(() => {
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

    function locateService($http, geoService, configService, errorService) {

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
         * Pans to the users location if possible, displaying an error message otherwise. The users
         * location is determined only once, and is reused on subsequent requests for performance.
         * @function find
         */
        function find() {
            const onFailedBrowserCB = () =>
                _apiLocate(
                    geoService.geolocate,
                    () => errorService.display('Your location could not be found.')
                );

            if (location.latitude) {
                geoService.geolocate(location);
            } else {
                _browserLocate(geoService.geolocate, onFailedBrowserCB);
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
                    geoService.geolocate({
                        latitude: apiResponse.data.location.lat,
                        longitude: apiResponse.data.location.lng
                    });
                }, onFailure);
            } else {
                onFailure();
            }
        }
    }

})();
