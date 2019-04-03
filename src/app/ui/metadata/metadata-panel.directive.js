/**
 * @module rvMetadataPanel
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvMetadataPanel` directive wraps the side panel's metadata content.
 *
 */
angular
    .module('app.ui')
    .directive('rvMetadataPanel', rvMetadataPanel);

/**
 * `rvMetadataPanel` directive body.
 *
 * @function rvMetadataPanel
 * @return {object} directive body
 */
function rvMetadataPanel(referenceService) {
    const directive = {
        restrict: 'E',
        scope: {},
        link: link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, el) {
        referenceService.panes.metadata = el;
    }
}

function Controller(stateManager, tocService) {
    'ngInject';
    const self = this;

    self.display = stateManager.display.metadata;
    self.tocService = tocService;
}
