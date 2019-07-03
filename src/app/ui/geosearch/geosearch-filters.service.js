/* global RV */

/**
 * @module geosearchFiltersService
 * @memberof app.ui
 * @description
 *
 * The `geosearchFiltersService` is responsible for passing filter state to the geoSearch module and keeping them synced.
 *
 */
angular
    .module('app.ui')
    .factory('geosearchFiltersService', geosearchFiltersService);

function geosearchFiltersService($translate, events, configService, geoService, geosearchService) {

    const service = {
        provinces: [], // filter drop downs will be empty until province and type lists are loaded
        types: [],

        // list of integers from 1..n-1 (where n = provinces.length or types.length), used to iterate through filters in geosearch-top-filters.html
        provinceIndexes: [],
        typeIndexes: [],

        setProvince,
        setType,
        setVisible
    };

    const ref = {
        extentChangeListener: angular.noop
    };

    // geoSearch service fails if you call `getProvinces` or `getTypes` before config is ready; need to wait for config;
    // TODO: change geoSearch external functions return promises to be trully async, and not just fail.
    configService.onEveryConfigLoad(config => {
        if (config.map.components.geoSearch.enabled) {
            init();
        }
    });


    events.$on(events.rvLanguageChanged, () => {
        // on language change clear the filters
        geosearchService.setProvince(undefined);
        geosearchService.setType(undefined);
    })

    return service;

    /**
     * Sets the filter promise for the query.
     *
     * @function setProvince
     * @param {String} provinceCode code of the province to be set
     */
    function setProvince(provinceCode) {
        geosearchService.setProvince(provinceCode);
    }

    /**
     * Sets the type promise for the query.
     *
     * @function setType
     * @param {String} typeCode code of the results type to be set
     */
    function setType(typeCode) {
        geosearchService.setType(typeCode);
    }

    /**
     * Sets the 'show items from the current extent only' filter.
     *
     * @function setVisible
     * @param {Boolean} visibleOnly specifies that only items from the current extent should be included in the query
     */
    function setVisible(visibleOnly) {

        if (visibleOnly) {
            //
            ref.extentChangeListener = events.$on(events.rvExtentChange, setExtentParameter);
        } else {
            ref.extentChangeListener(); // unsubscribe from event
        }

        setExtentParameter();

        /***/

        /**
         * Internally, 'visible' value is ignored at low zoom levels, but the ui is not updated to not confuse the user.
         * on each extent change event, the extent is validated and it's determined if `visible only` parameter should be included in the query
         *
         * @function setExtentParameter
         * @private
         */
        function setExtentParameter() {
            const targetExtentValue = geoService.validateExtent(1.15) ?
                (visibleOnly ? 'visible' : 'canada') :
                'canada';

            console.log('geosearchFiltersService', 'setting isvisible to', visibleOnly, targetExtentValue);

            geosearchService.setExtent(targetExtentValue);
        }
    }

    /**
     * Initializes the geosearch filters services after the config file is ready by fetching province and type filter lists.
     *
     * @function init
     * @private
     */
    function init() {
        // add loading label to the filters drop downs while their content is loading
        service.provinces = [{ name: $translate.instant('geosearch.loadingfilters.label') }];
        service.types = [{ name: $translate.instant('geosearch.loadingfilters.label') }];
        configService.getAsync.then(config => {
            geosearchService.getProvinces().then(values => {
                service.provinces = values;
                service.provinceIndexes = Array.from(Array(service.provinces.length), (prov, idx) => idx);

                // sort the province filters in alphabetical order
                service.provinces.sort((provA, provB) => (provA.name > provB.name) ? 1 : -1);
            });
            geosearchService.getTypes().then(values => {
                const disabledSearches = configService.getSync.services.search.disabledSearches || [];
                service.types = values.filter(x => !disabledSearches.includes(x.code))
                service.typeIndexes = Array.from(Array(service.types.length), (type, idx) => idx);

                // sort the type filters in alphabetical order
                service.types.sort((provA, provB) => (provA.name > provB.name) ? 1 : -1);
            });
        })
    }
}
