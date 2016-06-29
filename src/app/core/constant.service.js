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
            rvReady: 'rvReady',
            rvApiReady: 'rvApiReady',

            rvDataPrint: 'rvDataPrint', // these data events should be removed after switching to angular 1.5 or 2 or React
            rvDataExportCSV: 'rvDataExportCSV'
        })
        .constant('translations', AUTOFILLED_TRANSLATIONS);
})();
