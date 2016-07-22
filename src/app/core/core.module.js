/* global angularDragula */
(() => {
    'use strict';

    /**
     * @namespace app.core
     * @description
     *
     * The `app.core` module pull in all the commonly used dependencies.
     */
    angular.module('app.core', [
        /*
         * Angular modules
         */
        'ngAnimate', 'ngMaterial', 'ngSanitize', 'ngMessages',

        /*
         * Reusable cross app code modules
         */
        'app.common',
        'app.common.router',

        /*
         * 3rd Party modules
         */
        'pascalprecht.translate',
        'dotjem.angular.tree',
        'flow',
        'minicolors',
        angularDragula(angular)
    ]);
})();
