(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name version
     * @module app.core
     * @description
     *
     * The 'version' constant service provides current version numbers and the timestap.
     */
    angular
        .module('app.core')
        .constant('version', {
            major: '_MAJOR_',
            minor: '_MINOR_',
            patch: '_PATCH_',
            hash: '_HASH_',
            timestamp: '_TIMESTAMP_'
        });
})();
