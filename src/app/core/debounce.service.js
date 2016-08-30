(() => {

    /**
     * @ngdoc service
     * @name debounceService
     * @module app.core
     *
     * @description debounce JavaScript methods
     *
     */
    angular
        .module('app.core')
        // article: http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
        // source: http://jsfiddle.net/Warspawn/6K7Kd/ (adapted from angular's $timeout code)
        .factory('debounceService', ['$rootScope', '$browser', '$q', '$exceptionHandler',
            ($rootScope, $browser, $q, $exceptionHandler) => {
                let deferreds = {};
                let methods = {};
                let uuid = 0;

                function debounce(fn, delay, invokeApply) {
                    const deferred = $q.defer();
                    const promise = deferred.promise;
                    const skipApply = (angular.isDefined(invokeApply) && !invokeApply);

                    // check we dont have this method already registered
                    let methodId;
                    let bouncing = false;
                    angular.forEach(methods, (value, key) => {
                        if (angular.equals(methods[key].fn, fn)) {
                            bouncing = true;
                            methodId = key;
                        }
                    });

                    // not bouncing, then register new instance
                    if (!bouncing) {
                        methodId = uuid++;
                        methods[methodId] = { fn: fn };
                    } else {
                        // clear the old timeout
                        deferreds[methods[methodId].timeoutId].reject('bounced');
                        $browser.defer.cancel(methods[methodId].timeoutId);
                    }

                    const debounced = function () {
                        // actually executing? clean method bank
                        methods.splice(methodId, 1);

                        try {
                            deferred.resolve(fn());
                        } catch (e) {
                            deferred.reject(e);
                            $exceptionHandler(e);
                        }

                        if (!skipApply) { $rootScope.$apply(); }
                    };

                    // track id with method
                    const timeoutId = $browser.defer(debounced, delay);
                    methods[methodId].timeoutId = timeoutId;

                    const cleanup = function () {
                        deferreds.splice(promise.$$timeoutId, 1);
                    };

                    promise.$$timeoutId = timeoutId;
                    deferreds[timeoutId] = deferred;
                    promise.then(cleanup, cleanup);

                    return promise;
                }

                // similar to angular's $timeout cancel
                debounce.cancel = function (promise) {
                    if (promise && promise.$$timeoutId in deferreds) {
                        deferreds[promise.$$timeoutId].reject('canceled');
                        return $browser.defer.cancel(promise.$$timeoutId);
                    }
                    return false;
                };

                return debounce;
            }]);
})();
