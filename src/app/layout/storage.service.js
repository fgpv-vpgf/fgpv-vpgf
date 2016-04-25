(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name storageService
     * @module app.layout
     *
     * @description
     * The 'storageService' service stores information about the the layout, like width/height of the panels.
     */
    angular
        .module('app.layout')
        .factory('storageService', storageService);

    function storageService() {
        const service = {
            panels: {},
            panes: {} // registry for content pane nodes
        };

        return service;

    }
})();
