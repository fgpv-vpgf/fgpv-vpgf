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

function referenceService($rootElement) {

    const service = {
        panels: {},
        panes: {}, // registry for content pane nodes,

        peekAtMap,

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

        isFiltersVisible: false
    };

    return service;

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
