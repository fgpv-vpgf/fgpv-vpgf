(() => {
    'use strict';

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

    // do not modify the line below without also modifying the build function which fills in the translations
    const AUTOFILLED_TRANSLATIONS = {};

    angular
        .module('app.core')
        .constant('events', {
            rvReady: 'rvReady', // Fired when map should be created the first time
            rvApiHalt: 'rvApiHalt', // Fired when API should be put back into 'queue' mode
            rvApiReady: 'rvApiReady', // Fired when API should let calls through
            rvBookmarkInit: 'rvBookmarkInit', // Fired after the bookmark has modified the config

            rvDataPrint: 'rvDataPrint', // these data events should be removed after switching to angular 1.5 or 2 or React
            rvDataExportCSV: 'rvDataExportCSV'
        })
        .constant('translations', AUTOFILLED_TRANSLATIONS)
        .value('appInfo', {
            id: null
            // something else ?
        });
})();
