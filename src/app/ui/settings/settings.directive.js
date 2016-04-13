(() => {
    'use strict';

    const SETTING_SECTIONS = {
        display: [
            'boundingBox',
            'opacity'
        ],
        data: [
            'snapshot'
        ]
    };

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

        // indicates which setting sections are displayed based on the available toc entry settings
        self.settingSectionVisibility = {
            display: true,
            data: true
        };

        self.display = stateManager.display.settings;
        self.tocEntry = null;
        self.opacityValue = 0;

        // watch for changing display value and store reference to new tocEntry and its opacity value
        $scope.$watch('self.display.data', newValue => {
            if (newValue) {
                self.tocEntry = newValue;
                if (self.tocEntry.options.opacity) {
                    self.opacityValue = self.tocEntry.options.opacity.value;
                }

                // check which setting sections should be visible
                Object.entries(SETTING_SECTIONS)
                    .forEach(([key, value]) =>
                        self.settingSectionVisibility[key] = value.some(element =>
                            typeof self.tocEntry.options[element] !== 'undefined'
                        )
                    );
            }
        });

        activateOpacitySetting();

        /***/

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
             * Applies current opacity value from the settings panel to the tocEntry if it differs from its current opacity value.
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
