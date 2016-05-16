(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name errorService
     * @module app.ui.common
     * @requires
     * @description
     *
     * The `errorService` factory handles the display of error toasts
     *
     */
    angular
        .module('app.ui.common')
        .factory('errorService', errorService);

    function errorService($mdToast) {
        const service = {
            display
        };

        return service;

        /**
         * Renders a toast message containing the supplied errorMsg
         *
         * @param {String} errorMsg     The message to display inside the toast
         * @param {Object} parentElem   optional element to attach toast message. Appears on bottom of element if supplied, default is rootElement
         */
        function display(errorMsg, parentElem) {

            const opts = {
                textContent: errorMsg,
                action: 'Close',
                hideDelay: 0,
                position: 'left right bottom'
            };

            if (typeof parentElem !== 'undefined') {
                opts.parent = parentElem;
            }

            return $mdToast.hide().then(() => { // hide any pre-existing toast
                $mdToast.show($mdToast.simple(opts));
            });
        }
    }
})();
