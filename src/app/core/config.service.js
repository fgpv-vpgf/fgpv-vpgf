(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('configService', configService);

    /* @ngInject */
    function configService($q, $rootElement, $timeout, $http, configDefaults) {
        var initDeferred = $q.defer();
        var isInitialized = false;

        var service = {
            data: {},
            initialize: initialize,
            ready: ready
        };

        return service;

        ////////////////

        function initialize() {
            var configAttr = $rootElement.attr('th-config');
            var configJson;

            // This function can only be called once.
            if (isInitialized) {
                return initDeferred.promise;
            }

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
                        .then(function (data) {
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

            return initDeferred.promise;

            function configInitialized(config) {
                // apply any defaults from layoutConfigDefaults, then merge config on top
                // TODO: this is an exampe; actual merging of the defaults is more complicated
                angular.merge(service.data, configDefaults, config);

                isInitialized = true;

                initDeferred.resolve();
            }
        }

        function ready(nextPromises) {
            var readyPromise = initDeferred.promise;

            return readyPromise
                .then(function () {
                    console.log('Ready promise resolved.');
                    return $q.all(nextPromises);
                })
                .catch(function () {
                    console.log('"ready" function failed');
                });
        }
    }
})();
