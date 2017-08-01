/**
 * @module errorService
 * @memberof app.ui
 * @description
 *
 * The `errorService` factory handles the display of error toasts
 *
 */
angular
    .module('app.ui')
    .factory('errorService', errorService);

function errorService($mdToast) {
    const service = {
        display,
        remove
    };

    return service;

    /**
    * Hides a toast object
    * @param {Object} toastMsg is a promise object returned by the display function
    * @function remove
    */
    function remove(toastMsg) {
        $mdToast.hide(toastMsg);
    }

    /**
     * Renders a toast message containing the supplied errorMsg
     *
     * @function display
     * @param {String} errorMsg     The message to display inside the toast
     * @param {Object} parentElem   optional element to attach toast message. Appears on bottom of element if supplied, default is rootElement
     * @return {Promise}
     */
    function display(errorMsg, parentElem) {
        const opts = {
            textContent: errorMsg,
            // action: 'Close',
            // hideDelay: 0,
            position: 'bottom rv-flex-global'
        };

        if (typeof parentElem !== 'undefined') {
            opts.parent = parentElem;
        }

        return $mdToast.show($mdToast.simple(opts));
    }
}
