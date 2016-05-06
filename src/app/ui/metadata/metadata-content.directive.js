(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMetadataContent
     * @module app.ui.metadata
     * @restrict E
     * @description
     *
     * The `rvMetadataContent` directive renders the data content of metadata.
     *
     */
    angular
        .module('app.ui.metadata')
        .directive('rvMetadataContent', rvMetadataContent);

    /**
     * `rvMetadataContent` directive body.
     *
     * @return {object} directive body
     */
    function rvMetadataContent() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/metadata/metadata-content.html',
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
