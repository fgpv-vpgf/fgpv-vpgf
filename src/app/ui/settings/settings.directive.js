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

    function Controller(stateManager, $scope, $timeout) {
        'ngInject';
        const self = this;
        self.Math = window.Math;

        self.display = stateManager.display.settings;
        self.tocEntry = null;
        self.opacityValue = 0;

        // watch for changing display value and store reference to new tocEntry and its opacity value
        $scope.$watch('self.display.data', newValue => {
            if (newValue) {
                self.tocEntry = newValue;
                self.opacityValue = self.tocEntry.options.opacity.value;
            }
        });

        activateOpacitySetting();

        /*********/

        function activateOpacitySetting() {
            // flag indicating the opacity timeout is active
            let opacityTimeoutActive = false;
            const opacityTimeoutDuration = 30; // in ms

            // watch for changing slider to set actual layer opacity
            $scope.$watch('self.opacityValue', newValue => {
                // console.log('opacity --->', newValue, self.opacityValue);

                if (angular.isNumber(newValue) && self.tocEntry && !opacityTimeoutActive) {
                    // set opacity immediately
                    setTocEntryOpacity();
                    opacityTimeoutActive = true;
                    $timeout(setTocEntryOpacity, opacityTimeoutDuration); // wait a bit before setting opacity again
                }
            });

            /**
             * Sets actual opacity value on the tocEntry if it differs from the current opacity value.
             */
            function setTocEntryOpacity() {
                if (self.tocEntry.options.opacity.value !== self.opacityValue) {
                    console.log('update opacity to', self.opacityValue);
                    self.tocEntry.setOpacity(self.opacityValue);
                }

                opacityTimeoutActive = false;
            }
        }
    }
})();
