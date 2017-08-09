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
     * @param {Object} opts toast options object; see https://material.angularjs.org/latest/api/service/$mdToast for details
     * @return {Promise} resolving when the toast is hidden
     */
    function display(opts) {
        const extendedOpts = angular.extend({}, {
            position: 'bottom rv-flex-global'
        }, opts);

        return $mdToast.show($mdToast.simple(extendedOpts));
    }
}
