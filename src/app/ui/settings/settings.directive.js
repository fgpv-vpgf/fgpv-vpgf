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

    function Controller(stateManager, $scope) {
        'ngInject';
        const self = this;
        self.display = stateManager.display.settings;
        self.Math = window.Math;

        // watch for changing slider to set actual layer opacity
        $scope.$watch('self.display.data.opacity.value', (newValue, oldValue) => {
            console.log(newValue, oldValue);
            if (newValue) {
                self.display.data.layerItem.setOpacity(newValue);
            }
        });

        activate();

        /*********/

        function activate() {

        }
    }
})();
