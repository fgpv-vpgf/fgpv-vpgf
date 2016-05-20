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

<<<<<<< HEAD
=======
            console.debug(errorMsg, parentElem);
>>>>>>> 6214c6444410cef0b19aa605a717d8b4fe336fb9
            const opts = {
                textContent: errorMsg,
                action: 'Close',
                hideDelay: 0,
<<<<<<< HEAD
                position: 'left right bottom'
=======
                position: 'bottom rv-flex-global'
>>>>>>> 6214c6444410cef0b19aa605a717d8b4fe336fb9
            };

            if (typeof parentElem !== 'undefined') {
                opts.parent = parentElem;
            }

<<<<<<< HEAD
            $mdToast.show($mdToast.simple(opts));
=======
            return $mdToast.show($mdToast.simple(opts));
>>>>>>> 6214c6444410cef0b19aa605a717d8b4fe336fb9
        }
    }
})();
