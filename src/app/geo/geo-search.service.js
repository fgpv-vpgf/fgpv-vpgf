(() => {
    // TODO: Move this into config along with the other geosearch config options - see issue #1164
    const URLS = {
        GEONAMES: {
            'en-CA': 'http://geogratis.gc.ca/services/geoname/en/geonames.json',
            'fr-CA': 'http://geogratis.gc.ca/services/geoname/fr/geonames.json'
        },
        GEOLOCATION: {
            'en-CA': 'http://geogratis.gc.ca/services/geolocation/en/locate?q=',
            'fr-CA': 'http://geogratis.gc.ca/services/geolocation/fr/locate?q='
        },
        GEOSUGGEST: {
            'en-CA': 'http://geogratis.gc.ca/services/geolocation/en/suggest?q=',
            'fr-CA': 'http://geogratis.gc.ca/services/geolocation/fr/suggest?q='
        },
        PROVINCES: {
            'en-CA': 'http://geogratis.gc.ca/services/geoname/en/codes/province.json',
            'fr-CA': 'http://geogratis.gc.ca/services/geoname/fr/codes/province.json'
        },
        TYPES: {
            'en-CA': 'http://geogratis.gc.ca/services/geoname/en/codes/concise.json',
            'fr-CA': 'http://geogratis.gc.ca/services/geoname/fr/codes/concise.json'
        }
    };

    /**
     * @module geoSearch
     * @memberof app.geo
     *
     * @description
     * geoLocation service consumes five external geogratis services; provinces, concise, suggest, locate, and geonames.
     */
    angular
        .module('app.geo')
        .factory('geoSearch', geoSearch);

    function geoSearch($http, $q, configService, geoService, gapiService) {
        let provinceList; // list of provinces fulfilled by getProvinces
        let typeList; // list of types fulfilled by getTypes
        let manualExtent; // extent object if manual extent filtering is required
        let bbox; // string ('visible' or 'canada') or extent object which will be converted into a proper extent lat/lng string
        const queryParams = {}; // geoName $http get parameters

        const service = {
            query,
            setRadius,
            setType,
            setProvince,
            setExtent,
            getProvinces,
            getTypes
        };

        return service;

        /**
         * Include results within a set kilometer radius. Passing a value of undefined clears the radius.
         *
         * @function setRadius
         * @param   {String}    radius   the radius in kilometers from the search query to include in the results
         */
        function setRadius(radius) {
            setQueryParam('radius', radius);
        }

        /**
         * Include results with the given type. Passing a value of undefined clears the type.
         *
         * @function setType
         * @param   {String}    type   the type code all results must have
         */
        function setType(type) {
            setQueryParam('concise', type);
        }

        /**
         * Include results in the given province. Passing a value of undefined clears the province.
         *
         * @function setProvince
         * @param   {String}    province   the province code all results must be in
         */
        function setProvince(province) {
            setQueryParam('province', province);
        }

        /**
         * Include results in the given extent. Passing a value of undefined clears the province. Note that
         * a string can also be passed with a value of 'visible' (converted to current extent) or 'canada' (converted to whole of Canada extent)
         *
         * @function setExtent
         * @param   {Object}    extent   mapObject extent object, or string value of either 'visible' or 'canada'
         */
        function setExtent(extent) {
            bbox = extent;
        }

        /**
         * Fetches the list of all possible provinces in a geoName query.
         *
         * @function getProvinces
         * @return   {Promise}    resolves to a list of all provinces in the form
         *                          {
         *                              code: numeric province code (i.e. ontario is 35)
         *                              abbr: short hand notation (Ontario is ON)
         *                              name: full province name
         *                          }
         */
        function getProvinces() {
            return $q((resolve, reject) => {
                // only fetch list once, otherwise resolve immediately with known list
                if (typeof provinceList !== 'undefined') {
                    resolve(provinceList);
                } else {
                    $http.get(URLS.PROVINCES[configService.currentLang()]).then(result => {
                        provinceList = result.data.definitions.map(def => ({
                            code: def.code,
                            abbr: def.term,
                            name: def.description
                        }));
                        resolve(provinceList);
                    }, reject);
                }
            });
        }

        /**
         * Fetches the list of all possible types in a geoName query.
         *
         * @function getTypes
         * @return   {Promise}    resolves to a list of all types in the form
         *                          {
         *                              code: Short form code (i.e. TERR)
         *                              name: Full type name (i.e. Territory)
         *                          }
         */
        function getTypes() {
            return $q((resolve, reject) => {
                // only fetch list once, otherwise resolve immediately with known list
                if (typeof typeList !== 'undefined') {
                    resolve(typeList);
                } else {
                    $http.get(URLS.TYPES[configService.currentLang()]).then(result => {
                        typeList = result.data.definitions.map(def => ({
                            code: def.code,
                            name: def.term
                        }));
                        resolve(typeList);
                    }, reject);
                }
            });
        }

        /**
         * Given some string query, returns a promise that resolves as an object with one of two possible properties; 'results' or 'suggestions'.
         * If no results are found, a list of possible suggestions is returned instead.
         *
         *      - 'results' property containing a list of results in the following form:
         *          {
         *              name: name of the found query (i.e. lake name, city name, monument name etc.)
         *              type {
         *                  code: Short form code (i.e. TERR)
         *                  name: Full type name (i.e. Territory)
         *              }
         *              location: {
         *                  city
         *                  province: {
         *                      code: numeric province code (i.e. ontario is 35)
                                abbr: short hand notation (Ontario is ON)
                                name: full province name
         *                  }
         *                  latitude
         *                  longitude
         *              }
         *              bbox: list of bounding areas in the form [WEST, SOUTH, EAST, NORTH]
         *          }
         *
         *      - 'suggestions' property with a list of strings containing possible query values
         *
         * @function query
         * @param   {String}    q   the search string this query is based on
         * @return  {Promise}   resolves to a list of results when the query is complete
         */
        function query(q) {
            // delete any prior query terms
            delete queryParams.q;

            // Send this off immediately to save time if we need it later (no geoName result)
            const geoSuggestion = $http.get(URLS.GEOSUGGEST[configService.currentLang()] + q);

            // wait for pre-query to finish before making geoNames request
            const results = preQuery(q).then(() => {
                return $http.get(URLS.GEONAMES[configService.currentLang()], { params: queryParams }).then(result => {
                    // these should have been called already, just in case they haven't
                    return $q.all([getProvinces(), getTypes()]).then(() => {
                        return postQuery(result.data.items.map(item => ({
                            name: item.name,
                            type: typeList.find(concise => concise.code === item.concise.code),
                            location: {
                                city: item.location,
                                province: provinceList.find(prov => prov.code === item.province.code),
                                latitude: parseFloat(item.latitude),
                                longitude: parseFloat(item.longitude)
                            },
                            bbox: item.bbox
                        })));
                    });
                });
            });

            return results.then(res => {
                // bundle results into a result object, or a suggestion result if no results are found.
                return res.length === 0 ?
                    geoSuggestion.then(s => ({ suggestions: s.data.suggestions })) :
                    { results: res };
            });
        }

        /**
         * Creates/updates geoName service query parameters before the service is called. This function has two main jobs:
         *     - Capture current extent and convert into a geoName readable lat/lng string
         *     - Call the geoLocation service for FSA and NTS detected queries for their lat/lng values
         *
         * Note that FSA and NTS queries are intercepted and replaced with lat/lng properties from the geoLocation service.
         *
         * @function preQuery
         * @private
         * @param   {String}    q   the search string this query is based on
         * @return  {Promise}   resolves to undefined when all pre-query operations are complete
         */
        function preQuery(q) {
            // capture the current extent here as it can change between queries
            let extent = bbox;
            if (extent === 'visible') { // get the viewers current extent
                extent = geoService.mapObject.extent;

            } else if (extent === 'canada') { // get the full extent of Canada
                extent = geoService.getFullExtent();
            }

            if (typeof extent === 'object') { // convert to lat/lng geoName readable string
                const minCoords = gapiService.gapi.proj.localProjectPoint(
                    geoService.mapObject.spatialReference, 'EPSG:4326', { x: extent.xmin, y: extent.ymin });

                const maxCoords = gapiService.gapi.proj.localProjectPoint(
                    geoService.mapObject.spatialReference, 'EPSG:4326', { x: extent.xmax, y: extent.ymax });

                extent = [minCoords.x, minCoords.y, maxCoords.x, maxCoords.y].join(',');
            }

            setQueryParam('bbox', extent);

            return $q((resolve, reject) => {
                // define regex expressions for FSA, NTS, or LAT/LNG inputs
                const fsaReg = /^[A-Za-z]\d[A-Za-z]/;
                const ntsReg = /^\d{1,3}[A-Z]\/\d{1,3}$/;
                const latlngReg = /^-?\d{1,3}\.\d+,-?\d{1,3}\.\d+$/;

                // FSA or NTS - use geoService to find point information (in lat/lng)
                if (fsaReg.test(q) || ntsReg.test(q)) {
                    $http.get(URLS.GEOLOCATION[configService.currentLang()] + q).then(results => {
                        setLatLng(...results.data[0].geometry.coordinates.reverse());
                        resolve();
                    }, reject);

                // LAT/LNG inputted as query, split lat/lng string into individual components
                } else if (latlngReg.test(q)) {
                    setLatLng(...q.split(','));
                    resolve();

                // no lat/lng information is needed (delete any existing from prior query)
                } else {
                    delete queryParams.lat;
                    delete queryParams.lon;
                    queryParams.q = q;
                    // TODO: remove this once geoNames service actually filters by bbox, currently bugged
                    // This forces manual filtering even if bbox is set in the query
                    manualExtent = queryParams.bbox;
                    resolve();
                }
            });
        }

        /**
         * Manually filters results when the geoName query could not contain the full filtering criteria.
         *
         * @function postQuery
         * @private
         * @param   {Array}    results   the results array obtained from the query function (containing modified geoName results)
         * @return  {Array}    the final list of results after filtering
         */
        function postQuery(results) {
            if (typeof manualExtent !== 'undefined') {
                const extent = manualExtent.split(',').map(parseFloat);
                return results.filter(r => r.location.longitude >= extent[0] && r.location.longitude <= extent[2] &&
                    r.location.latitude >= extent[1] && r.location.latitude <= extent[3]);
            }

            return results;
        }

        /**
         * Helper function which sets query parameters, or deletes them entirely iff
         * value is undefined
         *
         * @function setQueryParam
         * @private
         * @param   {String}    paramName   a valid geoName query parameter
         * @param   {String}    value       the geoName query parameter value
         */
        function setQueryParam(paramName, value) {
            queryParams[paramName] = value;

            if (typeof queryParams[paramName] === 'undefined') {
                delete queryParams[paramName];
            }
        }

        /**
         * Set the query parameters lat/lng values, and move bbox property.
         *
         * @function setLatLng
         * @private
         * @param   {String}    lat   latitude
         * @param   {String}    lng   longitude
         */
        function setLatLng(lat, lng) {
            [queryParams.lat, queryParams.lon] = [lat, lng];

            // lat/lng with bbox is not allowed in a geoName query. Remove bbox
            // from query and save to manualExtent which will manually filter after results have come back
            if (queryParams.bbox) {
                manualExtent = queryParams.bbox;
                delete queryParams.bbox;
            }
        }
    }

})();
