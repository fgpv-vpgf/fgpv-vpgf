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

function layoutService($rootElement, $rootScope) {

    const ref = {
        onResizeSubscriptions: [] // [ { element: <Node>, listeners: [Function ... ] } ... ]
    };

    const service = {
        currentLayout,
        isShort,

        panels: {},
        panes: {}, // registry for content pane nodes,

        _mapNode: null,
        set mapNode (value) {
            if (this._mapNode) {
                console.error('Map node can only be set once');
                return;
            }

            this._mapNode = value;
        },

        get mapNode () { return this._mapNode; },

        get mainPanelsOffset () { return getPanelOffset() },

        onResize,
        peekAtMap,

        LAYOUT: {
            SMALL: 'small',
            MEDIUM: 'medium',
            LARGE: 'large'
        },
        isFiltersVisible: false
    };

    return service;

    /**
    * Determines the current layout type as either small, medium, or large depending on the width of the $rootElement
    * @function  currentLayout
    * @return  {String} either 'small', 'medium', or 'large'
    */
    function currentLayout() {
        if ($rootElement.width() <= 480) {
            return service.LAYOUT.SMALL;
        } else if ($rootElement.width() <= 840) {
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

    /**
     * Briefly makes all panels almost transparent so the map underneath can be clearly see.
     * Restores the regular opacity on the next click/touch event.
     *
     * @function peekAtMap
     */
    function peekAtMap() {
        // filter out the shell it's a container for everything
        const filteredPanels = Object.entries(service.panels)
            .filter(( [name] ) => name !== 'shell')
            .map(([name, panel]) => panel);

        // convert panel of jQuery object into a jQuery array
        const jQuerywrappedPanels = angular.element(angular.element.map(filteredPanels, el => el.get() ));

        let ignoreClick = true;

        // otherPanels.addClass('rv-lt-lg-hide');
        jQuerywrappedPanels.addClass('rv-peek rv-peek-enabled');
        jQuerywrappedPanels.on('click.peek mousedown.peek touchstart.peek', () =>
            ignoreClick ? (ignoreClick = false) : _removePeekTransparency());
        const deRegisterReiszeWatcher = service.onResize($rootElement, (newDimensions, oldDimensions) => {
            if (newDimensions.width !== oldDimensions.width || newDimensions.height !== oldDimensions.height) {
                _removePeekTransparency();
            }
        });

        function _removePeekTransparency() {
            jQuerywrappedPanels.removeClass('rv-peek-enabled');
            jQuerywrappedPanels.off('.peek');
            deRegisterReiszeWatcher();
        }
    }

    /**
     * Returns the main and data panel offsets relative to the visible map.
     *
     * @return {Object} fractions of the current extent occupied by main and data panels in the form of { x: <Number>, y: <Number> }
     */
    function getPanelOffset() {
        // calculate what portion of the screen the main and filter panels take
        const { main, table } = service.panels;

        const offsetFraction = {
            x: (main.filter(':visible').length > 0 ? main.width() : 0) /
                service.mapNode.width() / 2,
            y: (table.filter(':visible').length > 0 ? table.height() : 0) /
                service.mapNode.height() / 2
        };

        return offsetFraction;
    }
}
