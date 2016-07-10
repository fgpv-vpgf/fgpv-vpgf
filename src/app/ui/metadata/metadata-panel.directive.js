(() => {
    'use strict';

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
        .module('app.ui.metadata')
        .directive('rvMetadataPanel', rvMetadataPanel);

    /**
     * `rvMetadataPanel` directive body.
     *
     * @function rvMetadataPanel
     * @return {object} directive body
     */
    function rvMetadataPanel(layoutService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/metadata/metadata-panel.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el) {
            layoutService.panes.metadata = el;
        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.metadata;
    }
})();
