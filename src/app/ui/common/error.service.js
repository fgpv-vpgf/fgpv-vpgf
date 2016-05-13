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
                console.debug(opts);
                $mdToast.show($mdToast.simple(opts));
            });
        }
    }
})();
