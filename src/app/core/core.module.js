(function () {
    'use strict';

    angular.module('app.core', [
        /*
         * Angular modules
         */
        'ngAnimate', 'ngMaterial', 'ngSanitize',//, 'ngRoute',

        /*
         * Our reusable cross app code modules
         */
        'common.router',
        //'blocks.exception', 'blocks.logger', 'blocks.router',

        /*
         * 3rd Party modules
         */
        'pascalprecht.translate',
        'ui.router'
        //'ui.bootstrap',     // ui-bootstrap (ex: carousel, pagination, dialog)
        //'breeze.angular',   // tells breeze to use $q instead of Q.js
        //'breeze.directives',// breeze validation directive (zValidate)
        //'ngplus',           // ngplus utilities
        //'ngzWip'            // zStorage and zStorageWip
    ]);
})();
