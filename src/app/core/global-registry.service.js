(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name globalRegistry
     * @module app.core
     * @description
     *
     * The `globalRegistry` constant wraps around RV global registry for a single point of reference. Use this to access `RV` global.
     * It's useful if we need to change the name of the global registry.
     *
     */
    angular
        .module('app.core')
        .constant('globalRegistry', window.RV);
})();
