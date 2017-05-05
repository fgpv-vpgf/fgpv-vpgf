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

    function geoSearch($http, $q, configService, geoService, gapiService, $rootScope, events, $translate) {
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
            zoomSearchExtent,
            zoomScale
        };

        init();

        return service;

        /**
         * Configure search from config file.
         *
         * @function init
         * @private
         */
        function init() {
            // reset geosearch on every config reload, this will include language changes as well
            configService.onEveryConfigLoad(config => {
                provinceList = undefined;
                typeList = undefined;

                if (typeof config.services.search === 'undefined') {
                    enabled = false;
                } else {
                    enabled = true;
                    serviceUrls = config.services.search.serviceUrls;
                    disableSearch = config.services.search.disabledSearches;
                }
            });
        }

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

                        // add types from geogratis service (NTS, FSA) and for scale and coordinates
                        typeList.push({ code: 'NTS', name: $translate.instant('geosearch.type.nts') });
                        typeList.push({ code: 'FSA', name: $translate.instant('geosearch.type.fsa') });
                        typeList.push({ code: 'SCALE', name: $translate.instant('geosearch.type.scale') });
                        typeList.push({ code: 'COORD', name: $translate.instant('geosearch.type.latlong') });

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

            // get geogratis, provinces and types values
            const pre = $q.all([preQuery(q), getProvinces(), getTypes()]);

            // get geonames values
            const query = pre.then(() => $http.get(serviceUrls.geoNames, { params: queryParams })
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
                            .then(s => ({ suggestions: s.data.suggestions, results: [] })) :
                        { results: res }
                ));

            // return value from geogratis and geonames services
            return $q.all([pre, query]).then(([[preQueryResults], names]) => {

                // check if there is values for NTS, FSA, Scale or coordinates nad filter them
                let otherValues = preQueryResults.filter(item =>
                    (typeof queryParams.concise === 'undefined' || (queryParams.concise === item.type.code)));

                // if results are present, add the FSA, NTS, Scale or coordinates to the results.
                names.results = otherValues.concat(names.results);

                return names;
            });
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

            // eslint-disable-next-line complexity
            return $q((resolve, reject) => {
                // define regex expressions for FSA, NTS, lat/long or scale inputs
                // fot NTS http://www.nrcan.gc.ca/earth-sciences/geography/topographic-information/maps/9765
                // for lat/long dd http://stackoverflow.com/questions/3518504/regular-expression-for-matching-latitude-longitude-coordinates
                // for lat long dms http://stackoverflow.com/questions/19839728/regex-for-latitude-and-longitude-with-form-ddmmssx
                // jscs:disable maximumLineLength
                const fsaReg = /^[A-Za-z]\d[A-Za-z][*]$/; // look only for the first 3 characters because we do not have data for the whole postal code.
                const ntsReg = /^\d{3}[a-pA-P](0[1-9]|1[0-6])*[*]$/;
                const latlngRegDD = /^([-+]?([1-8]?\d(\.\d+)?|90(\.0+)?))([\s+|,|;])([-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?))[*]$/; // [-+] 0-90 [space , ;] [-+] 0-180 (lat/long)
                const latlngRegDMS = /^[-+]?(?:[0-8]\d|90)\s(?:[0-5]\d)\s(?:[0-5]\d)[,|;][-+]?(?:\d{2}|1[0-7]\d|180)\s(?:[0-5]\d)\s(?:[0-5]\d)[*]$/; // [+-] 0-90 [space] 0-60 [space] 0-60 [, ;] [+-] 0-120 [space] 0-60 [space] 60 [space] (lat/long)
                const scaleReg = /^[1][:]\d{1,3}[ ]*\d{1,3}[ ]*\d{1,3}[*]$/; // from 1:100 to 1:100 000 000
                // jscs:enable maximumLineLength

                // FSA or NTS - use geoService to find point information (in lat/long)
                if ((fsaReg.test(q) && isEnabled('FSA')) || (ntsReg.test(q) && isEnabled('NTS'))) {
                    $http.get(serviceUrls.geoLocation + q).then(results => {
                        setLatLng(...results.data[0].geometry.coordinates.reverse());
                        resolve(postQuery(results.data.map(item => parseData(item))));
                    }, reject);

                // lat/long inputted as query, split lat/long string into individual components
                } else if ((latlngRegDD.test(q) || latlngRegDMS.test(q)) && isEnabled('LAT/LNG')) {
                    // parse lat long to have it in decimal degree and formated like other element
                    let coord;
                    if (latlngRegDD.test(q)) {
                        coord = parseLatLong(q.slice(0, -1), 'dd');
                    } else {
                        coord = parseLatLong(q.slice(0, -1), 'dms');
                    }

                    setLatLng(coord.position[1], coord.position[0]);
                    resolve(postQuery([coord]));

                // no lat/long information is needed (delete any existing from prior query)
                } else {
                    delete queryParams.lat;
                    delete queryParams.lon;
                    queryParams.q = q;

                    // if scale, use value to zoom to a specific scale
                    if (scaleReg.test(q) && isEnabled('SCALE')) {
                        resolve([{ name: q.slice(0, -1),
                            type: { name: $translate.instant('geosearch.type.scale'), code: 'SCALE' } }]);
                    } else {
                        resolve([]);
                    }
                }
            });
        }

        /**
         * Parse data from geogratis service for FSA and NTS so they are the same format as geoname service
         *
         * @function parseData
         * @private
         * @param   {Object}    item   the item to parse
         * @return  {Object}    the parse item
         */
        function parseData(item) {
            // FSA and NTS 250 000 have their coordinates in reverse order
            // for canada it is easy to find because long is always minus and lat is always positive
            // this service only works for canadian data so it is ok
            const coord0 = parseFloat(item.geometry.coordinates[0]);
            const coord1 = parseFloat(item.geometry.coordinates[1]);
            const coordinates = (coord0 < coord1) ? [coord0, coord1] : [coord1, coord0]; // [long, lat]

            // FSA doesn't have a bbox attribute, apply buffer to create bbox from point coordinates
            const buff = 0.015; // degrees
            const bbox = (typeof item.bbox !== 'undefined') ? item.bbox :
                [coordinates[0] - buff, coordinates[1] - buff, coordinates[0] + buff, coordinates[1] + buff];

            // get type from the last item of type string
            const type = (typeof item.bbox !== 'undefined') ?
                { name: $translate.instant('geosearch.type.nts'), code: 'NTS' } :
                { name: $translate.instant('geosearch.type.fsa'), code: 'FSA' };

            return {
                name: item.title,
                type: type,
                location: {
                    latitude: coordinates[1],
                    longitude: coordinates[0]
                },
                bbox: bbox,
                position: coordinates
            };
        }

        /**
         * Parse lat long coordinates so they are the same format as geoname service
         *
         * @function parseLatLong
         * @private
         * @param   {String}    coord   the lat long coordinates
         * @param  {String}    type the type of coodinates (decimal degree - dd or degree minute second - dms)
         * @return {Object}     the parse item
         */
        function parseLatLong(coord, type) {
            // if decimal degree, split by one of the delimiters
            // if degree, minute, second, convert to decimal degree
            let coordinates = (type === 'dd') ? coord.split(/[\s|,|;|]/) : convertLatLongDms(coord);
            coordinates = coordinates.map(item => parseFloat(item)).reverse(); // reverse, need to be long/lat

            // apply buffer to create bbox from point coordinates
            const buff = 0.015; // degrees
            const bbox = [coordinates[0] - buff, coordinates[1] - buff, coordinates[0] + buff, coordinates[1] + buff];

            return {
                name: coord,
                type: { name: $translate.instant('geosearch.type.latlong'), code: 'COORD' },
                location: {
                    latitude: coordinates[1],
                    longitude: coordinates[0]
                },
                bbox: bbox,
                position: coordinates
            };
        }

        /**
         * Convert lat long in degree minute second to decimal degree
         *
         * @function convertLatLongDMS
         * @private
         * @param   {String}    coord   the lat long coordinates ("latitude,longitude")
         *                                  * "45,-100"
         *                                  * "56.54535455;120.344342"
         * @return {Array}     the lat long coordinate in decimal degree [lat, long]
         */
        function convertLatLongDms(coord) {
            const latLong = coord.split(/[,|;]/);
            const lat = latLong[0].split(' ').map(item => parseFloat(item));
            const long = latLong[1].split(' ').map(item => parseFloat(item));
            let latdd = Math.abs(lat[0]) + lat[1] / 60 + lat[2] / 3600; // unsigned
            let longdd = Math.abs(long[0]) + long[1] / 60 + long[2] / 3600; // unsigned

            // check if we need to reset sign
            latdd = (lat[0] > 0) ? latdd : latdd * -1;
            longdd = (long[0] > 0) ? longdd : longdd * -1;

            return [latdd, longdd];
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

                // compare extent so it will include item even if the centroide is not visible.
                // for example, 250 000 NTS is huge but not visible even if the map extent is totally within bbox if
                // centroide is not visible
                return results.filter(r => !(r.bbox[0] > extent[2] || r.bbox[2] < extent[0] ||
                                               r.bbox[3] < extent[1] || r.bbox[1] > extent[3]));
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
         * Zoom to scale
         *
         * @function zoomScale
         * @private
         * @param   {String}    scale   the scale to zoom to
         */
        function zoomScale(scale) {
            // remove space if scale is like 1 000 000 then use map to zoom to scale
            geoService.mapObject.setScale(parseInt(scale.replace(/ /g, '')));
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
