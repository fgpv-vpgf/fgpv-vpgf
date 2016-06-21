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
    angular
        .module('app.core')
        .constant('events', {
            rvReady: 'rvReady',
            rvApiReady: 'rvApiReady',

            rvDataPrint: 'rvDataPrint', // these data events should be removed after switching to angular 1.5 or 2 or React
            rvDataExportCSV: 'rvDataExportCSV'
        });
})();
