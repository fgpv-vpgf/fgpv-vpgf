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
         * Autolinks strings; doesn't not modify the original.
         *
         * @function autolink
         * @param {Array|String} items array of strings or a single string to autolink
         * @param {Object} options [optional = {}] linkifyjs options object; the only default changed is classname (rv-linkified) for consistency
         * @return {Array|String} array or string of autolinked strings
         */
        function autolink(items, options = {}) {
            // item must be a string
            const results = Array.isArray(items) ?
                items.map(process) :
                process(items);

            return results;

            /**
             * Autolink helper function.
             *
             * @function process
             * @private
             * @param {String} item string to autolink
             * @return {String} autolinked string
             */
            function process(item) {
                return linkifyStr((item || '').toString(), angular.extend(defaultOptions, options));
            }
        }
    }
})();
