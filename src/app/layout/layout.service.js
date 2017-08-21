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

function layoutService($rootElement, $rootScope, fullScreenService) {

    const ref = {
        onResizeSubscriptions: [] // [ { element: <Node>, listeners: [Function ... ] } ... ]
    };

    const service = {
        currentLayout,
        isShort,

        onResize,

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

    /**
     * Registers a size change listener against a supplied node element.
     *
     * @function onResize
     * @param {Object} element a node to watch for size changes
     * @param {Function} callback a function to call on size changes; the callback is called with { oldDimensions, newDimensions }; dimension objects specify element's height and width { width: <Number>, height: <Number> };
     * @return {Function} a function to deregister listener
     */
    function onResize(element, callback) {

        let subscription = ref.onResizeSubscriptions.find(s =>
            s.element === element);

        if (subscription) {
            subscription.listeners.push(callback);
        } else {
            subscription = {
                element,
                listeners: [callback]
            };

            ref.onResizeSubscriptions.push(subscription);

            $rootScope.$watch(watchBBoxChangesBuilder(element), (newDimensions, oldDimensions) => {
                ref.onResizeSubscriptions
                    .find(s => s.element === element)
                    .listeners.forEach(l => l(newDimensions, oldDimensions));
            }, true);
        }

        // build a deregister function
        // TODO: the watch on the element can be also removed to improve performance
        return () => {
            const callbackIndex = subscription.listeners.indexOf(callback);

            if (callbackIndex) {
                subscription.listeners.splice(callbackIndex, 1);
            }
        };

        /**
         * Watches dimension change on the element node.
         *
         * @function watchBBoxChanges
         * @private
         * @param {Object} element element to watch for changes
         * @return {Object} object in the form of { width: <Number>, height: <Number> } which reflects the size of the node
         */
        function watchBBoxChangesBuilder(element) {
            return () => {
                const br = element[0].getBoundingClientRect(); // jquery.width/height functions round pixel sizes :(

                return {
                    width: br.width,
                    height: br.height
                };
            };
        }
    }
}
