(() => {
    'use strict';

    /**
     * @module rvReverse
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * `rvReverse` filter reverses a given array.
     *
     */
    angular
        .module('app.ui.common')
        .filter('rvReverse', reverseFilter);

    function reverseFilter() {
        return filter;

        /***/

        function filter(items) {
            return items.slice().reverse();
        }
    }
})();
