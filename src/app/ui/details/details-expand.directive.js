(() => {
    'use strict';

    /**
     * @module rvDetailsExpand
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsExpand` directive allows details to be expanded into a modal box when
     * the expand button is clicked.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsExpand', rvDetailsExpand);

    /**
     * `rvDetailsExpand` directive body.
     *
     * @function rvDetailsExpand
     * @return {object} directive body
     */
    function rvDetailsExpand() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-expand.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(stateManager, $mdDialog, storageService) {
        'ngInject';
        const self = this;

        self.expandPanel = expandPanel;

        function expandPanel() {
            $mdDialog.show({
                controller: () => {},
                parent: storageService.panels.shell,
                locals: {
                    item: stateManager.display.details.selectedItem,
                    cancel: $mdDialog.cancel
                },
                templateUrl: 'app/ui/details/details-modal.html',
                clickOutsideToClose: true,
                disableParentScroll: false,
                escapeToClose: true,
                controllerAs: 'self',
                bindToController: true
            });
        }
    }
})();
