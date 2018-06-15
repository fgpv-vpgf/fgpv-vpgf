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

function geosearchFiltersService($translate, events, configService, geoSearch, geoService) {

    const service = {
        provinces: [], // filter drop downs will be empty until province and type lists are loaded
        types: [],

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

    return service;

    /**
     * Sets the filter promise for the query.
     *
     * @function setProvince
     * @param {String} provinceCode code of the province to be set
     */
    function setProvince(provinceCode) {
        geoSearch.setProvince(provinceCode);
    }

    /**
     * Sets the type promise for the query.
     *
     * @function setType
     * @param {String} typeCode code of the results type to be set
     */
    function setType(typeCode) {
        geoSearch.setType(typeCode);
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

            geoSearch.setExtent(targetExtentValue);
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

        geoSearch.getProvinces().then(values =>
            (service.provinces = values));

        geoSearch.getTypes().then(values =>
            (service.types = values));
    }
}
