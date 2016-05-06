(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMetadataPanel
     * @module app.ui.metadata
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
     * @return {object} directive body
     */
    function rvMetadataPanel() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/metadata/metadata-panel.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.metadata;
    }
})();
