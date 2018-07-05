/**
 * @module rvRange
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * `rvRange` filter loop inside a ng-repeat.
 *
 */
angular
    .module('app.ui')
    .filter('rvRange', rangeFilter);

function rangeFilter() {
    return filter;

    /***/

    function filter(input, start, total, step = 1, multi = 1, suffix = '') {
        total = parseInt(total);
        start = parseInt(start);
        step = parseFloat(step);
        multi = parseInt(multi);

        while (start <= total) {
            input[`${start * multi}`] = `${start}${suffix}`;
            start += step;
        }

        return input;
    }
}