(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name helpService
     * @module app.ui.help
     * @description
     *
     * The `helpService` service provides stores for help items
     *
     */
    angular
        .module('app.ui.help')
        .service('helpService', helpService);

    function helpService() {
        'ngInject';

        // all help sections (populated when elements tagged with rv-help are created)
        const registry = [];

        // all help sections currently drawn
        const drawnCache = [];

        const service = {
            register: register,
            unregister: unregister,
            registry: registry,
            drawnCache: drawnCache,
            setDrawn: setDrawn,
            clearDrawn: clearDrawn
        };

        return service;

        /**
        * Adds an object to the service's registry.
        *
        * @param {Object} object    the object to be added
        */
        function register(object) {
            registry.push(object);
        }

        /**
        * Removes an object from the service's registry.
        *
        * @param {Object} object    the object to be removed
        */
        function unregister(object) {
            registry.splice(registry.indexOf(object), 1);
        }

        /**
        * Adds an object to the service's cache of already drawn help sections.
        *
        * @param {Object} object    the object to be added
        */
        function setDrawn(object) {
            drawnCache.push(object);
        }

        /**
        * Clears the service's cache of already drawn help sections.
        *
        */
        function clearDrawn() {
            drawnCache.length = 0;
        }
    }
})();
