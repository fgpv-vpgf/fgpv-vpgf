/**
 * @module storageService
 * @memberof app.layout
 *
 * @description
 * The 'storageService' service stores information about the the layout, like width/height of the panels.
 */
angular
    .module('app.layout')
    .factory('storageService', storageService);

function storageService() {
    const service = {

        _mapNode: null,

        set mapNode (value) {
            if (this._mapNode) {
                console.error('Map node can only be set once');
                return;
            }

            this._mapNode = value;
        },

        get mapNode () { return this._mapNode; },
        /**
         * Panels
         */
        panels: {},
        /**
         * Registry for content pane nodes
         */
        panes: {},

        getPanelOffset
    };

    return service;

    /**
     * Returns the main and data panel offsets relative to the visible map.
     *
     * @return {Object} fractions of the current extent occupied by main and data panels in the form of { x: <Number>, y: <Number> }
     */
    function getPanelOffset() {
        // calculate what portion of the screen the main and filter panels take
        const { main, filters } = service.panels;

        const offsetFraction = {
            x: (main.filter(':visible').length > 0 ? main.width() : 0) /
                service.mapNode.width() / 2,
            y: (filters.filter(':visible').length > 0 ? filters.height() : 0) /
                service.mapNode.height() / 2
        };

        return offsetFraction;
    }
}
