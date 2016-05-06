(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMetadataExpand
     * @module app.ui.metadata
     * @restrict E
     * @description
     *
     * The `rvMetadataExpand` directive allows metadata to be expanded into a modal box when
     * the expand button is clicked.
     *
     */
    angular
        .module('app.ui.metadata')
        .directive('rvMetadataExpand', rvMetadataExpand);

    /**
     * `rvMetadataExpand` directive body.
     *
     * @return {object} directive body
     */
    function rvMetadataExpand() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/metadata/metadata-expand.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(stateManager, $mdDialog) {
        'ngInject';
        const self = this;

        self.expandPanel = showExpandPanel ? expandPanel : undefined;
        self.showExpandPanel = showExpandPanel;

        function showExpandPanel() {
            return stateManager.state.sideMetadata.active === true;
        }

        function expandPanel() {
            $mdDialog.show({
                controller: ($scope, display, cancel) => {
                    $scope.display = display;
                    $scope.cancel = cancel;
                },
                locals: {
                    display: stateManager.display.metadata,
                    cancel: $mdDialog.cancel
                },
                templateUrl: 'app/ui/metadata/metadata-modal.html',
                clickOutsideToClose: true,
                escapeToClose: true
            });
        }
    }
})();
