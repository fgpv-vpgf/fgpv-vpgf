(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvSettings
     * @module app.ui.settings
     * @restrict E
     * @description
     *
     * The `rvSettings` directive wraps the side panel settings content.
     *
     */
    angular
        .module('app.ui.settings')
        .directive('rvSettings', rvSettings);

    /**
     * `rvSettings` directive body.
     *
     * @return {object} directive body
     */
    function rvSettings() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/settings/settings.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller() {
        activate();

        ///////////

        function activate() {

        }
    }
})();
