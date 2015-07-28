(function() {
    'use strict';

    angular
        .module('app.core')
        .factory('config', config);

    config.$inject = ['$q', '$rootElement', '$timeout', '$http'];

    /* @ngInject */
    function config($q, $rootElement, $timeout, $http) {
        var service = {
            data: {},
            initialize: initialize
        };

        return service;

        ////////////////

        function initialize() {
            var deferred = $q.defer();
            var configAttr = $rootElement.attr('th-config');

            var configJson;

            // check if config attribute exist
            if (configAttr) {
                // check if it's a valid JSON
                try {
                    configJson = angular.fromJson(configAttr);
                    configInitialized(configJson);
                } catch (e) {
                    console.log('Not valid JSON');
                }

                // try to load config file
                if (!configJson) {
                    $http
                        .get(configAttr)
                        .then(function(data) {
                            if (data.data) {
                                configJson = data.data;
                            }

                            // simulate delay to show loading splash
                            $timeout(function () {
                                configInitialized(configJson);
                            }, 2000);

                            //configInitialized(configJson);
                        });
                }
            } else {
                configInitialized({});
            }

            return deferred.promise;

            function configInitialized(config) {
                service.data = config;
                deferred.resolve();
            }
        }
    }
})();
