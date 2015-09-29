(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name common
     * @module app.core
     * @description
     *
     * The `common` service provides access to commonly used services and functions like $timeout, $broadcast, $q, logger, etc.
     *
     * @requires $timeout
     * @return {service}    `common` service
     */
    angular
        .module('app.core')
        .factory('common', common);

    // TODO: add helper function to common
    /* @ngInject */
    function common($timeout) {
        var service = {
            $timeout: $timeout
        };

        return service;

        ////////////////
    }
})();
