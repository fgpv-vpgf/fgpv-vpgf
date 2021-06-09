/**
 * @name configDefaults
 * @constant
 * @memberof app.core
 * @description
 *
 * The `configDefaults` constant service provides default config values.
 */
/**
 * @name templateRegistry
 * @constant
 * @memberof app.core
 * @description
 *
 * The `templateRegistry` constant service provides template URLs.
 */

angular
    .module('app.core')
    .factory('events', events)
    .constant('bookmarkVersions', {
        // Bookmark versions https://github.com/fgpv-vpgf/fgpv-vpgf/wiki/Bookmark-Formats
        A: 'A',
        B: 'B',
    })
    .constant('translations', AUTOFILLED_TRANSLATIONS)
    .factory('appInfo', appInfo);

function events($rootScope) {
    return {
        /**
         * A shorthand for $rootScope.$on; no need to inject `$rootScope` separately;
         *
         * @function $on
         * @param {String} eventName event name to listen once
         * @param {Function} listener a callback function to execute
         * @return {Function} a deregister function
         */
        $on: (...args) => $rootScope.$on(...args),
        $broadcast: (...args) => $rootScope.$broadcast(...args),
        $unsubscribe: (...events) => {
            events.forEach((event) => {
                $rootScope.$$listeners[event] = [];
            });
        },

        rvReady: 'rvReady', // Fired when map should be created the first time; should not be broadcasted more then once
        rvApiHalt: 'rvApiHalt', // Fired when API should be put back into 'queue' mode
        rvApiReady: 'rvApiReady', // Fired when API should let calls through
        rvBookmarkInit: 'rvBookmarkInit', // Fired after the bookmark has modified the config
        rvBookmarkDetected: 'rvBookmarkDetected', // Fired if we actually have a bookmark in play

        rvDataPrint: 'rvDataPrint', // these data events should be removed after switching to angular 1.5 or 2 or React
        rvDataExportCSV: 'rvDataExportCSV',
        rvDataReady: 'rvDataReady', // Fired when table is loaded

        // config state transitions
        rvConfigAdded: 'rvConfigAdded',
        rvCfgLoad: 'rvCfgLoad',
        rvCfgInitialized: 'rvCfgInitialized',
        rvCfgUpdated: 'rvCfgUpdated',
        // TODO find a better name for this one:  rvCfgUpdating: 'rvCfgUpdating',

        rvLayerRecordLoaded: 'rvLayerRecordLoaded',
        rvMapLoaded: 'rvMapLoaded',
        rvMapPan: 'rvMapPan',
        rvMapZoomStart: 'rvMapZoomStart',
        rvExtentChange: 'extentChange', // TODO: rename event to `rvExtentChange` and all the instances that use hardcoded `extentChange` instance
        rvClick: 'rvClick', // Fired when a click occurs
        rvKeyboardMove: 'rvKeyboardMove', // Fired when arrow keys are used to move over the map (use to calculate mouse coordinates)
        rvMouseMove: 'rvMouseMove', // Fired when mouse move over the map (use to calculate mouse coordinates)
        rvBasemapChange: 'rvBasemapChange', // Fired when basemap is changed
        rvBasemapLoaded: 'rvBasemapLoaded',
        rvHighlightDetailsItem: 'rvHighlightDetailsItem',
        rvGeosearchClose: 'rvGeosearchClose', // Fire when geosearch close
        rvTableReady: 'rvTableReady',
        rvFeatureMouseOver: 'rvFeatureMouseOver',
        rvProjectiontChanged: 'rvProjectiontChanged',
        rvLanguageChanged: 'rvLanguageChanged',
        rvFilterChanged: 'rvFilterChanged', // fires when a filter updates

        rvSymbDefinitionQueryChanged: 'rvSymbDefinitionQueryChanged', // TODO consider depreciating/removing. rvFilterChanged should handle symbols

        // fired when mApi is ready but before plugins are executed
        rvApiPrePlugin: 'rvApiPrePlugin',
        rvApiPreMapAdded: 'rvApiPreMapAdded',
        rvApiMapAdded: 'rvApiMapAdded',
        rvApiLayerAdded: 'rvApiLayerAdded',
    };
}

// Angular services that have no constructors (services that are just plain objects) are __shared__ across app instances
// to have it per instance, the appInfo service needs to have some initialization logic
function appInfo() {
    const service = {
        id: null,
        apiMap: null,
        isIE11: !!window.MSInputMethodContext && !!document.documentMode,
    };

    return service;
}
