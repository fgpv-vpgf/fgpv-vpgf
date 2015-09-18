(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('common', common);

    /* @ngInject */
    function common($timeout) {
        var service = {
            $timeout: $timeout
        };

        return service;

        ////////////////
    }
})();
