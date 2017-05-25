const templateUrl = require('./settings-content.html');

/**
 * @module rvSettingsContent
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvSettingsContent` directive renders the data content of details.
 * To improve efficency a document fragment is first created prior to
 * DOM insertion.
 *
 */
angular
    .module('app.ui')
    .directive('rvSettingsContent', rvSettingsContent);

/**
 * `rvSettingsContent` directive body.
 *
 * @function rvSettingsContent
 * @return {object} directive body
 */
function rvSettingsContent() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            block: '='
        },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(common) {
    'ngInject';
    const self = this;

    self.checkAvailableControls = checkAvailableControls;

    /**
     * @function checkAvailableControls
     * @private
     * @param {String} names
     * @return {Boolean} true if at least one of the supplied control names is available in block
     */
    function checkAvailableControls(names) {
        return common.intersect(self.block.availableControls, names.split('|')).length > 0;
    }
}
