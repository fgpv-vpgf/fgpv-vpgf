(function() {
    'use strict';

    angular
        .module('app.core')
        .factory('common', common);

    common.$inject = ['$timeout'];

    /* @ngInject */
    function common($timeout) {
        var service = {
            $timeout: $timeout,
            isString: isString,
            isNumber: isNumber
        };

        return service;

        ////////////////

        function isString(val) {
            // http://stackoverflow.com/a/9436948
            return (typeof val === 'string' || val instanceof String);
        }

        function isNumber(val) {
            // negative or positive
            return (/^[-]?\d+$/).test(val);
        }
    }
})();
