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
        panes: {}
    };

    return service;

}
