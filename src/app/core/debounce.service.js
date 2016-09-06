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
        .factory('debounceService', debounceService);

    function debounceService($rootScope, $timeout) {

        const service = {
            registerDebounce
        };

        return service;

        /************************/

        /** Registers a function for debouncing. If the returned function is executed more than once at intervals less that the detection period, only the first call will go through.
         * @function registerDebounce
         * @param {Function} fn a function to debounced
         * @param {Number} delay optional; detection period for debouncing
         * @param {Boolean} before optional; true if the function is trigger before bouncing
         * @param {Boolean} skipApply optional; skips triggering a digest cycle
         * @private
         * @return {Function} a debounced function; execute at will
         */
        // article: http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
        function registerDebounce(fn, delay = 175, before = true, skipApply = false) {
            let timeoutHandle;
            let bouncing = false; // bouncing is true when the function is called during the detection period after the first call

            return (...args) => {
                if (!bouncing) {
                    // fire function before bouncing
                    if (before) { fn(...args); }
                    if (!skipApply) {
                        $rootScope.$applyAsync(); // applyAsync during the next digest cycle
                    }
                    bouncing = true;
                }

                $timeout.cancel(timeoutHandle);
                timeoutHandle = $timeout(() => {
                    // fire function when bouncing is done
                    if (!before) { fn(...args); } // pass any arguments to the registered function
                    bouncing = false;
                }, delay); // stop bouncing
            };
        }
    }

})();
