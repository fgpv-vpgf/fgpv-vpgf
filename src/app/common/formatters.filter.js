/* global linkifyStr */
(() => {
    'use strict';

    /**
     * @name autolink
     * @constant
     * @memberof app.common
     * @description
     *
     * The autolink filter using https://github.com/SoapBox/linkifyjs.
     */
    angular
        .module('app.common')
        .filter('autolink', autolink);

    function autolink() {
        const defaultOptions = { className: 'rv-linkified' };

        return autolink;

        /**
         * @function autolink
         * @param {Array} items array of strings to autolink
         * @param {Object} options [optional = {}] linkifyjs options object; the only default changed is classname (rv-linkified) for consistency
         * @return {Array} array of autolinked strings
         */
        function autolink(items, options = {}) {
            // item must be a string
            const results = items.map(item =>
                linkifyStr((item || '').toString(), angular.extend(defaultOptions, options)));

            return results;
        }
    }
})();
