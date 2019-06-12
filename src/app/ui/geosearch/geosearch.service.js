/**
 * @module geosearchService
 * @memberof app.ui
 * @description
 *
 * The `geosearchService` is responsible for opening and closing geosearch panel and for running queries.
 *
 */
angular.module('app.ui').factory('geosearchService', geosearchService);

function geosearchService(
    $q,
    $rootScope,
    stateManager,
    referenceService,
    events,
    debounceService,
    mapService,
    geoService,
    gapiService,
    configService,
    appInfo
) {
    const queryParams = {}; // params to apply on filter
    let GSservice; // geosearch service from the geosearch feature

    events.$on(events.rvApiReady, () => {
        // initialize geosearch feature
        let language = configService.getSync.language === 'fr-CA' ? 'fr' : 'en';
        let excludeTypes = configService.getSync.services.search.disabledSearches;
        let settings = configService.getSync.services.search.settings;
        GSservice = new appInfo.features.geoSearch.GeoSearchUI({
            language,
            excludeTypes,
            settings
        });
    });

    const service = {
        isLoading: false, // waiting for results
        isResultsVisible: false, // showing results when we get some
        externalApiError: false,
        noResultsSearchValue: '', // the (previous) search term which returned no results
        serviceError: false,

        searchValue: '', // current search term
        searchValuePerm: '', // searchValue is cleared on esc, keep a reference
        searchResults: [], // currect search results

        runQuery,

        toggle: toggleBuilder(),
        onClose,

        setProvince,
        setType,
        setExtent,
        getProvinces,
        getTypes,

        zoomTo,
        zoomScale,
        zoomSearchExtent
    };

    const ref = {
        mainPanel: referenceService.panels.shell.find('[rv-state=main]'),

        runningRequestCount: 0 // used to track the latest query and discard results from previous ones if they resolve after an older query
    };

    events.$on(events.rvApiPreMapAdded, (_, api) => {
        service.mApi = api;
        api.panels.geoSearch.body = $('<rv-geosearch></rv-geosearch>');
        api.panels.geoSearch.isCloseable = true;
        api.panels.geoSearch.allowUnderlay = false;
        api.panels.geoSearch.allowOffscreen = true;

        // this is horrible, but `onCloseCallback` stateManager function doesn't work correctly
        api.panels.geoSearch.closing.subscribe(() => {
            // this will properly hide geosearch content
            onClose();

            // emit close to directive
            $rootScope.$emit(events.rvGeosearchClose);
        });
    });

    return service;

    /**
     * Builds a debounced toggle function to open and close geosearch content
     *
     * @function toggleBuilder
     * @private
     * @return {Function} a geosearch toggle function
     */
    function toggleBuilder() {
        return debounceService.registerDebounce(() => {
            service.mApi.panels.geoSearch.toggle();
        });
    }

    /**
     * Properly closes the geosearch content and restores previous panel if any. Do not clear the search term when closing
     * so when user come back he doesn't lose is search. Especially useful for small screen.
     *
     * @function onClose
     */
    function onClose() {
        // because search value is cleared on esc, reset it to make permanent when we close geosearch
        service.searchValue = service.searchValuePerm;
    }

    /**
     * Runs geosearch query and returns the results or suggestions.
     *
     * @function runQuery
     * @return {Promise} promise resolving with results (when results are found - { results: [] }) or suggestions (when results are not found - { suggestions: [] }) or nothing (when search value is not specified - {});
     */
    function runQuery() {
        const requestCount = ++ref.runningRequestCount;

        // skip when the search value is not specified
        if (!service.searchValue) {
            service.searchResults = [];
            service.isLoading = false;
            service.isResultsVisible = false;
            service.mApi.panels.geoSearch.element.css({
                opacity: 0,
                'pointer-events': 'none',
                bottom: 0
            });

            return $q.resolve();
        }

        // show loading indicator
        service.isLoading = true;

        return GSservice.query(`${service.searchValue}*`).then(
            data => {
                // hide loading indicator
                service.isLoading = false;
                service.isResultsVisible = true;
                service.mApi.panels.geoSearch.element.css({
                    opacity: 1,
                    'pointer-events': '',
                    bottom: ''
                });
                service.serviceError = false;

                // discard any old results
                if (requestCount === ref.runningRequestCount) {
                    let filteredData = filter(data);
                    service.searchResults = filteredData || [];

                    service.noResultsSearchValue = service.searchResults.length === 0 ? service.searchValue : '';
                }

                // return data for optional processing further down the promise chain
                return data;
            },
            _ => {
                service.searchResults = [];
                service.isLoading = false;
                service.isResultsVisible = true;
                service.serviceError = true;
            }
        );
    }

    /**
     * @function zoomTo
     * @param {Object} result a search result to zoom to
     */
    function zoomTo(result) {
        if (typeof result.bbox !== 'undefined') {
            zoomSearchExtent(result.bbox, result.position);
        } else {
            // zoom to a scale
            // name contain the search value inside result panel
            // in the case of a scale, it will be something like 1:100 000 (geo-search.service.js line 334)
            zoomScale(result.name.split(':')[1]);
        }
    }

    /**
     * Helper function that filters based on query parameters.
     *
     * @function filter
     * @param data {Array} An array of locations from the query
     */
    function filter(data) {
        if (queryParams.extent) {
            data = data.filter(
                r =>
                    !(
                        r.bbox[0] > queryParams.extent[2] ||
                        r.bbox[2] < queryParams.extent[0] ||
                        r.bbox[3] < queryParams.extent[1] ||
                        r.bbox[1] > queryParams.extent[3]
                    )
            );
        }
        if (queryParams.province) {
            data = data.filter(r => r.location.province && r.location.province.name === queryParams.province);
        }
        if (queryParams.type) {
            data = data.filter(r => r.type.name === queryParams.type);
        }
        return data;
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
     * Include results with the given type. Passing a value of undefined clears the type.
     *
     * @function setType
     * @param   {String}    type   the type code all results must have
     */
    function setType(type) {
        setQueryParam('type', type);
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
        if (extent === 'visible') {
            // get the viewers current extent
            extent = geoService.currentExtent;
        } else if (extent === 'canada') {
            // get the full extent of Canada
            extent = geoService.fullExtent;
        }

        if (typeof extent === 'object') {
            // convert to lat/long geoName readable string
            // use the extent to reproject because it use a densify object that keep
            // proportion and in the end good values for min and max. If we use points
            // the results are bad, especially in LCC
            const projExtent = gapiService.gapi.proj.localProjectExtent(extent, {
                wkid: 4326
            });

            extent = [projExtent.x0, projExtent.y0, projExtent.x1, projExtent.y1].join(',');
        }

        extent = extent.split(',').map(parseFloat);
        setQueryParam('extent', extent);
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
        return new Promise(
            resolve => {
                if (geoService.isMapReady) {
                    // isMapReady gets set to true only before the
                    // rvApiReady event is broadcasted, so this is a valid way to check
                    resolve(GSservice.fetchProvinces());
                } else {
                    events.$on(events.rvApiReady, () => {
                        resolve(GSservice.fetchProvinces());
                    });
                }
            },
            () => {
                service.externalApiError = true;
            }
        );
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
        return new Promise(
            resolve => {
                if (geoService.isMapReady) {
                    // isMapReady gets set to true only before the
                    // rvApiReady event is broadcasted, so this is a valid way to check
                    resolve(GSservice.fetchTypes());
                } else {
                    events.$on(events.rvApiReady, () => {
                        resolve(GSservice.fetchTypes());
                    });
                }
            },
            () => {
                service.externalApiError = true;
            }
        );
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
        geoService.setScale(parseInt(scale.replace(/ /g, '')));
    }

    /**
     * Zoom to the search extent bbox and show map pin at location
     *
     * @function zoomSearchExtent
     * @param   {Array}    bbox     4 coordinates for the bbox in the form of [xmin, ymin, xmax, ymax]
     * @param   {Array}    position       2 coordinates for the position in the form of [x, y]
     */
    function zoomSearchExtent(bbox, position) {
        //const mapObject = geoService.mapObject;
        const mapSR = geoService.currentExtent.spatialReference; //mapObject.spatialReference;
        const gapi = gapiService.gapi;

        // set extent from bbox
        const latlongExtent = gapi.Map.Extent(...bbox, {
            wkid: 4326
        });

        // reproject extent
        const projExtent = gapi.proj.localProjectExtent(latlongExtent, mapSR);

        // set extent from reprojected values
        const zoomExtent = gapi.Map.Extent(projExtent.x0, projExtent.y0, projExtent.x1, projExtent.y1, projExtent.sr);

        // zoom to location (expand the bbox to include all the area)
        geoService.setExtent(zoomExtent.expand(1.5)).then(() => {
            // get reprojected point and create point
            const geoPt = gapi.proj.localProjectPoint(4326, mapSR.wkid, [
                parseFloat(position[0]),
                parseFloat(position[1])
            ]);
            const projPt = gapi.proj.Point(geoPt[0], geoPt[1], mapSR);

            // show pin on the map
            mapService.addMarkerHighlight(projPt, false);
        });
    }
}
