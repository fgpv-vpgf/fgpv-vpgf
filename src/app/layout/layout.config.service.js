(function() {
    'use strict';

    angular
        .module('app.layout')
        .factory('layoutConfig', layoutConfig);

    layoutConfig.$inject = ['$q', 'config', 'layoutConfigDefaults'];

    /* @ngInject */
    function layoutConfig($q, config, layoutConfigDefaults) {
        var initDeferred = $q.defer();
        var isInitialized = false;

        var service = {
            initialize: initialize,
            ready: ready
        };

        return service;

        ////////////////

        function initialize() {
            // This function can only be called once.
            if (isInitialized) {
                return initDeferred.promise;
            }

            // apply any defaults from layoutConfigDefaults
            angular.merge(service, layoutConfigDefaults);

            // merge layout config section from the main config
            angular.merge(service, config.data.layout);

            // resolve and return a promise since everything is sync
            initDeferred.promise.then(initializeComplete);
            initDeferred.resolve();
            return initDeferred.promise;

            function initializeComplete() {
                console.log('Layout config initialized.');
            }
        }

        function ready(nextPromises) {
            var readyPromise = initDeferred.promise;

            return readyPromise
                .then(function() {
                    console.log('Ready promise resolved.');
                    return $q.all(nextPromises);
                })
                .catch(function() {
                    console.log('"ready" function failed');
                });
        }
    }
})();
