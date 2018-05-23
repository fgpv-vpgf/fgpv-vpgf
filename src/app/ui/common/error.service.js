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

function errorService($mdToast, $translate) {
    const service = {
        display,
        remove
    };

    let errorToast = null;
    let errorQueue = [];

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
     * Adds error toast to the queue
     * Renders the toast if there's no visible toast
     *
     * @function display
     * @param {Object} opts toast options object; see https://material.angularjs.org/latest/api/service/$mdToast for details
     * @return {Promise} resolving when the toast is hidden
     */
    function display(opts) {
        let lastError = errorQueue[errorQueue.length - 1];
        // add the toast to the queue if it doesn't have the same content as the one before it
        if (!lastError || lastError.textContent !== opts.textContent) {
            errorQueue.push(opts);
        }
        // if there's no visible toast render this one
        if (!errorToast) {
            return _render(opts);
        }
    }

    /**
     * Renders a toast message containing the supplied errorMsg
     *
     * @function _render
     * @param {Object} opts toast options object; see https://material.angularjs.org/latest/api/service/$mdToast for details
     * @return {Promise} resolving when the toast is hidden
     */
    function _render(opts) {
        errorToast = opts;
        // if there's a toast to render create and render it
        if (errorToast) {
            const extendedOpts = angular.extend({}, {
                position: 'bottom rv-flex-global'
            }, opts);

            return $mdToast.show($mdToast.simple(extendedOpts)).then(() => {
                // on resolution of the promise render the next toast in queue
                errorQueue.shift();
                _render(errorQueue[0]);
            });
        }
    }
}
