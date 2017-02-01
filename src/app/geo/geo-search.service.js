(() => {
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

    function geoSearch($http, $q, configService, geoService, gapiService, $rootScope, events) {
        let provinceList; // list of provinces fulfilled by getProvinces
        let typeList; // list of types fulfilled by getTypes
        let manualExtent; // extent object if manual extent filtering is required
        let bbox; // string ('visible' or 'canada') or extent object which will be converted into a proper extent lat/long string
        let enabled; // boolean indicating search is not disabled by config
        let serviceUrls;
        let disableSearch;

        const queryParams = {}; // geoName $http get parameters

        const service = {
            query,
            setRadius,
            setType,
            setProvince,
            setExtent,
            getProvinces,
            getTypes,
            isEnabled,
            zoomSearchExtent
        };

        // configure geosearch
        configureSearch();

        // if language change, reset geosearch
        $rootScope.$on(events.rvLangSwitch, () => {
            configureSearch();
            provinceList = undefined;
            typeList = undefined;
        });

        /**
         * Configure search from config file
         *
         * @function configureSearch
         */
        function configureSearch() {
            configService.getCurrent().then(config => {
                if (typeof config.search === 'undefined') {
                    enabled = false;
                } else {
                    enabled = true;
                    serviceUrls = config.search.serviceUrls;
                    disableSearch = config.search.disabledSearches;
                }
            });
        }

        return service;

        /**
         * Determines if search functionality is enabled/disabled by the config. If no type parameter is passed,
         * the status of the entire search feature is return, otherwise the status of query type is returned (i.e
         * if NTS or FSA searches are enabled in the config)
         *
         * @function isEnabled
         * @param   {String}    type   optional query type flag (NTS, FSA, LAT/LNG)
         */
        function isEnabled(type) {
            if (typeof type === 'undefined') {
                return enabled;

            } else {
                return !disableSearch || typeof disableSearch.find(t => t === type) !== 'undefined';
            }
        }

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
                    $http.get(serviceUrls.provinces).then(result => {
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
                    $http.get(serviceUrls.types).then(result => {
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
         *                      abbr: short hand notation (Ontario is ON)
         *                      name: full province name
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

            return $q.all([preQuery(q), getProvinces(), getTypes()])
                .then(() => $http.get(serviceUrls.geoNames, { params: queryParams }))
                .then(result => postQuery(result.data.items.map(item => ({
                    name: item.name,
                    type: typeList.find(concise => concise.code === item.concise.code),
                    location: {
                        city: item.location,
                        province: provinceList.find(prov => prov.code === item.province.code),
                        latitude: parseFloat(item.latitude),
                        longitude: parseFloat(item.longitude)
                    },
                    bbox: item.bbox,
                    position: item.position.coordinates
                }))))
                .then(res => res.length === 0 ?
                        $http.get(serviceUrls.geoSuggest + q)
                            .then(s => ({ suggestions: s.data.suggestions })) :
                        { results: res }
                );
        }

        /**
         * Creates/updates geoName service query parameters before the service is called. This function has two main jobs:
         *     - Capture current extent and convert into a geoName readable lat/long string
         *     - Call the geoLocation service for FSA and NTS detected queries for their lat/long values
         *
         * Note that FSA and NTS queries are intercepted and replaced with lat/long properties from the geoLocation service.
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

            if (typeof extent === 'object') { // convert to lat/long geoName readable string
                // use the extent to reproject because it use a densify object that keep
                // proportion and in the end good values for min and max. If we use points
                // the results are bad, especially in LCC
                const projExtent = gapiService.gapi.proj.localProjectExtent(extent, { wkid: 4326 });

                extent = [projExtent.x0, projExtent.y0, projExtent.x1, projExtent.y1].join(',');
            }

            setQueryParam('bbox', extent);

            return $q((resolve, reject) => {
                // define regex expressions for FSA, NTS, or lat/long inputs
                const fsaReg = /^[A-Za-z]\d[A-Za-z]/;
                const ntsReg = /^\d{1,3}[A-Z]\/\d{1,3}$/;
                const latlngReg = /^-?\d{1,3}\.\d+,-?\d{1,3}\.\d+$/;

                // FSA or NTS - use geoService to find point information (in lat/long)
                if ((fsaReg.test(q) && isEnabled('FSA')) || (ntsReg.test(q) && isEnabled('NTS'))) {
                    $http.get(serviceUrls.geoLocation + q).then(results => {
                        setLatLng(...results.data[0].geometry.coordinates.reverse());
                        resolve();
                    }, reject);

                // lat/long inputted as query, split lat/long string into individual components
                } else if (latlngReg.test(q) && isEnabled('LAT/LNG')) {
                    setLatLng(...q.split(','));
                    resolve();

                // no lat/long information is needed (delete any existing from prior query)
                } else {
                    delete queryParams.lat;
                    delete queryParams.lon;
                    queryParams.q = q;
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
         * Zoom to the search extent bbox and show map pin at location
         *
         * @function zoomSearchExtent
         * @param   {Array}    bbox     4 coordinates for the bbox in the form of [xmin, ymin, xmax, ymax]
         * @param   {Array}    position       2 coordinates for the position in the form of [x, y]
         */
        function zoomSearchExtent(bbox, position) {
            const mapObject = geoService.mapObject;
            const mapSR = mapObject.spatialReference;
            const gapi = gapiService.gapi;

            // set extent from bbox
            const latlongExtent = gapi.mapManager.Extent(...bbox, { wkid: 4326 });

            // reproject extent
            const projExtent = gapi.proj.localProjectExtent(
                latlongExtent, mapSR);

            // set extent from reprojected values
            const zoomExtent = gapi.mapManager.Extent(projExtent.x0, projExtent.y0,
                projExtent.x1, projExtent.y1, projExtent.sr);

            // zoom to location (expand the bbox to include all the area)
            mapObject.setExtent(zoomExtent.expand(1.5)).then(() => {
                // get reprojected point and create point
                const geoPt = gapi.proj.localProjectPoint(4326, mapSR.wkid,
                    [parseFloat(position[0]), parseFloat(position[1])]);
                const projPt = gapi.proj.Point(geoPt[0], geoPt[1], mapSR);

                // show pin on the map
                geoService.dropMapPin(projPt);
            });
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
         * Set the query parameters lat/long values, and move bbox property.
         *
         * @function setLatLng
         * @private
         * @param   {String}    lat   latitude
         * @param   {String}    lng   longitude
         */
        function setLatLng(lat, lng) {
            [queryParams.lat, queryParams.lon] = [lat, lng];

            // lat/long with bbox is not allowed in a geoName query. Remove bbox
            // from query and save to manualExtent which will manually filter after results have come back
            if (queryParams.bbox) {
                manualExtent = queryParams.bbox;
                delete queryParams.bbox;
            }
        }
    }

})();
