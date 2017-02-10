(() => {

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

    function layoutService($rootElement, $rootScope, sideNavigationService, mapNavigationService) {

        const ref = {
            onResizeSubscriptions: [] // [ { element: <Node>, listeners: [Function ... ] } ... ]
        };

        const service = {
            currentLayout,
            /**
             * Exposes sideNavigationSerivce
             * @member sidenav
             * @see sideNavigationSerivce
             */
            sidenav: sideNavigationService,
            /**
             * Exposes mapNavigationService
             * @member mapnav
             * @see mapNavigationService
             */
            mapnav: mapNavigationService,
            // FIXME explain how the two members below are different from those in storageService
            panels: {},
            panes: {}, // registry for content pane nodes,

            onResize
        };

        return service;

        /**
        * Determines the current layout type as either small, medium, or large depending on the width of the $rootElement
        * @function  currentLayout
        * @return  {String} either 'small', 'medium', or 'large'
        */
        function currentLayout() {
            if ($rootElement.width() <= 480) {
                return 'small';
            } else if ($rootElement.width() <= 840) {
                return 'medium';
            } else {
                return 'large';
            }
        }

        /**
         * Registers a size change listener agains a supplied node element.
         *
         * @function onResize
         * @param {Object} element a node to watch for size changes
         * @param {Function} callback a function to call on size changes; the callback is called with { oldDimensions, newDimensions }; dimension objects specify element's height and width { width: <Number>, height: <Number> };
         * @return {Function} a fucntion to deregister listener
         */
        function onResize(element, callback) {

            const subscription = ref.onResizeSubscriptions.find(s =>
                s.element === element);

            if (subscription) {
                subscription.listeners.push(callback);
            } else {
                ref.onResizeSubscriptions.push({
                    element,
                    listeners: [callback]
                });

                $rootScope.$watch(watchBBoxChangesBuilder(element), (newDimensions, oldDimensions) => {
                    ref.onResizeSubscriptions
                        .find(s => s.element === element)
                        .listeners.forEach(l => l(newDimensions, oldDimensions));
                }, true);
            }

            /**
             * Watches dimension change on the element node.
             *
             * @function watchBBoxChanges
             * @private
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
})();
