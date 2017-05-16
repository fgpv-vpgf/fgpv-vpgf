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
