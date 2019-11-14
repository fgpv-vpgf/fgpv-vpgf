const templateUrl = require('./mapnav-button.html');

/**
 * @module rvMapnavButton
 * @memberof app.ui
 * @description
 *
 * The `rvMapnavButton` directive is a map navigation component button.
 *
 */
angular
    .module('app.ui')
    .directive('rvMapnavButton', rvMapnavButton);

/**
 * `rvMapnavButton` directive body.
 *
 * @function rvMapnavButton
 * @return {object} directive body
 */
function rvMapnavButton(mapNavigationService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            name: '@' // get the name of the control object to fetch
        },
        link: linkFunc,
        controller: angular.noop,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /**
     * Skeleton link function.
     */
    function linkFunc(scope) { // el, attr, ctrl) {
        const self = scope.self;

        // getting toggle object from the navigation servcie directly using toggle's name
        self.control = mapNavigationService.controls[self.name];
    }
}
