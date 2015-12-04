(function () {
    'use strict';

    /**
     * @ngdoc module
     * @name app
     * @description
     * The root module ties other modules together providing a very straightforward way to add or remove modules from the application.
     *
     */
    angular.module('app', [
        /*
         * Order is not important. Angular makes a
         * pass to register all of the modules listed
         * and then when app.dashboard tries to use app.data,
         * it's components are available.
         */

        /*
         * Everybody has access to these.
         * We could place these under every feature area,
         * but this is easier to maintain.
         */
        'app.core',
        'app.templates',
        'app.geo',
        'app.ui',

        /*
         * Feature areas
         */
        'app.layout'
    ]);

    // a separate templates module is needed to facilitate directive unit testing
    angular.module('app.templates', []);
})();
