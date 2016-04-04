(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name configDefaults
     * @module app.core
     * @description
     *
     * The `configDefaults` constant service provides default config values.
     */
    /**
     * @ngdoc service
     * @name templateRegistry
     * @module app.core
     * @description
     *
     * The `templateRegistry` constant service provides template URLs.
     */
    angular
        .module('app.core')
        .constant('events', {
            rvReady: 'rvReady',

            rvDataPrint: 'rvDataPrint', // these data events should be removed after switching to angular 1.5 or 2 or React
            rvDataExportCSV: 'rvDataExportCSV'
        });
})();
