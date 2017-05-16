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
    .module('app.ui')
    .filter('rvReverse', reverseFilter);

function reverseFilter() {
    return filter;

    /***/

    function filter(items) {
        if (Array.isArray(items)) {
            return items.slice().reverse();
        } else {
            return undefined;
        }
    }
}
