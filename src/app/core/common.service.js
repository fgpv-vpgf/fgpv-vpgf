(() => {
    'use strict';

    /**
     * @memberof app.core
     * @module common
     * @requires $timeout
     * @description
     *
     * The `common` service provides access to commonly used services and functions like $timeout, $broadcast, $q, logger, etc.
     *
     */
    angular
        .module('app.core')
        .factory('common', common);

    // TODO: add helper function to common
    function common($timeout) {
        const service = {
            $timeout: $timeout,

            intersect,
            removeFromArray
        };

        return service;

        /**************/

        /**
         * // TODO: move this somewhere else.
         *
         * Calculates the intersection between two arrays; does not filter out duplicates.
         *
         * @function intersect
         * @private
         * @param {Array} array1 first array
         * @param {Array} array2 second array
         * @return {Array} intersection of the first and second arrays
         */
        function intersect(array1 = [], array2 = []) {
            return array1.filter(item =>
                    array2.indexOf(item) !== -1);
        }

        function removeFromArray(array, name) {
            let index = array.indexOf(name);
            if (index !== -1) {
                array.splice(index, 1);
            }
        }
    }
})();
