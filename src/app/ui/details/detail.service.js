(() => {
    'use strict';

    /**
     * @module detailService
     * @memberof app.ui
     * @description
     *
     * The `detailService` is responsible over detailed layer views
     *
     */
    angular
        .module('app.ui.filters')
        .factory('detailService', detailService);

    function detailService(stateManager, $mdDialog, storageService) {

        const service = {
            expandPanel
        };

        return service;

        function expandPanel(hasBackdrop = true) {
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
                bindToController: true,
                hasBackdrop
            });
        }
    }
})();
