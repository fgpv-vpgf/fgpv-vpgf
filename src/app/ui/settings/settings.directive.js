const SETTINGS_CONTENT_PANEL = '.rv-settings-content-panel';

/**
 * @module rvSettings
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvSettings` directive wraps the side panel settings content.
 *
 */
angular
    .module('app.ui')
    .directive('rvSettings', rvSettings);

/**
 * `rvSettings` directive body.
 *
 * @function rvSettings
 * @return {object} directive body
 */
function rvSettings($compile) {
    const directive = {
        restrict: 'E',
        scope: {},
        link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, element) {
        let contentPanel;
        const template = `<rv-settings-content block="self.block"></rv-settings-content>`;

        const self = scope.self;

        scope.$watch('self.display.data', updateSettingsPanel);

        function updateSettingsPanel(newLegendBlock) {
            contentPanel = element.find(SETTINGS_CONTENT_PANEL);

            if (newLegendBlock) {
                self.block = newLegendBlock;

                contentPanel
                    .empty()
                    .append($compile(template)(scope));
            } else {
                contentPanel.empty();
            }
        }
    }
}

function Controller(stateManager) {
    'ngInject';
    const self = this;
    self.display = stateManager.display.settings;
}
