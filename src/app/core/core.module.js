(function () {
    'use strict';

    /**
     * @ngdoc module
     * @name app.core
     * @description
     *
     * The `app.core` module pull in all the commonly used dependencies.
     */
    angular.module('app.core', [
        /*
         * Angular modules
         */
        'ngAnimate', 'ngMaterial', 'ngSanitize',

        /*
         * Reusable cross app code modules
         */
        'common.router',

        /*
         * 3rd Party modules
         */
        'pascalprecht.translate',
        'dotjem.angular.tree',
        'ui.router'
    ]);
})();
