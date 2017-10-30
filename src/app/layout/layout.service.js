/**
 * @module layoutService
 * @memberof app.layout
 *
 * @description
 * The `layoutService` service works as a UI-manager for the rest of the application. `layoutService` exposes services for individual components that can be called.
 */
angular
    .module('app.layout')
    .factory('layoutService', layoutService);

function layoutService($rootElement, fullScreenService) {

    const service = {
        currentLayout,
        isShort,

        LAYOUT: {
            SMALL: 'small',
            MEDIUM: 'medium',
            LARGE: 'large'
        }
    };

    return service;

    /**
    * Determines the current layout type as either small, medium, or large depending on the width of the $rootElement
    * @function  currentLayout
    * @return  {String} either 'small', 'medium', or 'large'
    */
    function currentLayout() {
        let elWidth;
        // IE doesn't like giving the correct width when in full screen
        // See: https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2266#issuecomment-320984287
        if (fullScreenService.isExpanded()) {
            elWidth = screen.width
        } else {
            elWidth = $rootElement.width();
        }

        if (elWidth <= 480) {
            return service.LAYOUT.SMALL;
        } else if (elWidth <= 840) {
            return service.LAYOUT.MEDIUM;
        } else {
            return service.LAYOUT.LARGE;
        }
    }

    /**
    * Determines whether the current height as short or not depending on the height of the $rootElement
    * @function  currentHeight
    * @return  {String} either 'short' or null for not being short
    */
    function isShort() {
        if ($rootElement.height() < 450) {
            return true;
        }

        return false;
    }
}
