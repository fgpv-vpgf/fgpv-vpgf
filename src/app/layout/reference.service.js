/**
 * @module referenceService
 * @memberof app.layout
 *
 * @description
 * The `referenceService` service works as a reference manager for the rest of the application. `referenceService` exposes references for individual components.
 */
angular
    .module('app.layout')
    .factory('referenceService', referenceService);

function referenceService($rootElement, $rootScope, events, configService, appInfo) {

    const ref = {
        onResizeSubscriptions: [] // [ { element: <Node>, listeners: [Function ... ] } ... ]
    };

    const service = {
        panels: {},
        panes: {}, // registry for content pane nodes,

        peekAtMap,
        onResize,

        _mapNode: null,
        set mapNode (value) {
            if (this._mapNode) {
                console.error('Map node can only be set once');
                return;
            }

            this._mapNode = value;
        },

        get mapNode () { return this._mapNode; },

        isFiltersVisible: false
    };

    // wire in a hook to peek at map.
    // this makes it available on the API
    events.$on(events.rvMapLoaded, () => {
        configService.getSync.map.instance.peekAtMap = (externalPanel = undefined) => {
            service.peekAtMap(externalPanel);
        };
    });

    return service;

    /**
     * Briefly makes all panels almost transparent so the map underneath can be clearly see.
     * Restores the regular opacity on the next click/touch event.
     *
     * @function peekAtMap
     * @param {Object | undefined} [pointOfInterest = undefined] A point given by {x: number, y: number} where x and y are screen coordinates in pixels
     */
    function peekAtMap(pointOfInterest = undefined) {
        let ignoreClick = true;

        let panelsToFade = appInfo.mapi.panels.all.filter(panel => panel.isOpen).map(panel => panel.element);
        panelsToFade.push(this.panels.appBar);

        // if theres a point specified, remove all panels from the list that aren't close to it
        if (pointOfInterest) {
            panelsToFade = panelsToFade.filter(panel => {
                const box = panel[0].getBoundingClientRect();
                // collision detection w/ 50px buffer
                const buffer = 50;
                return !(box.right < pointOfInterest.x - buffer ||
                    box.left > pointOfInterest.x + buffer ||
                    box.top > pointOfInterest.y + buffer ||
                    box.bottom < pointOfInterest.y - buffer);
            });
        }

        panelsToFade.forEach(panel => {
            panel.addClass('rv-peek rv-peek-enabled');
        });

        appInfo.mapi.mapDiv.on('click.peek mousedown.peek touchstart.peek', () =>
                ignoreClick ? (ignoreClick = false) : _removePeekTransparency());

        const deRegisterResizeWatcher = service.onResize($rootElement, (newDimensions, oldDimensions) => {
            if (newDimensions.width !== oldDimensions.width || newDimensions.height !== oldDimensions.height) {
                _removePeekTransparency();
            }
        });

        function _removePeekTransparency() {
            panelsToFade.forEach(panel => {
                panel.removeClass('rv-peek-enabled');
                appInfo.mapi.mapDiv.off('.peek');
            });
            deRegisterResizeWatcher();
        }
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
