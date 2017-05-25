const templateUrl = require('./details-modal.html')

/**
 * @module detailService
 * @memberof app.ui
 * @description
 *
 * The `detailService` is responsible over detailed layer views
 *
 */
angular
    .module('app.ui')
    .factory('detailService', detailService);

function detailService($mdDialog, stateManager, geoService, storageService) {

    const service = {
        expandPanel,
        closeDetails
    };

    return service;

    /**
     * Opens a dialog panel with feature details.
     *
     * @function expandPanel
     * @param {Boolean} hasBackdrop [optional = true] specifies if a backdrop should be displayed behind the dialog popup
     */
    function expandPanel(hasBackdrop = true) {
        $mdDialog.show({
            controller: () => {},
            parent: storageService.panels.shell,
            locals: {
                item: stateManager.display.details.selectedItem,
                cancel: $mdDialog.cancel
            },
            templateUrl,
            clickOutsideToClose: true,
            disableParentScroll: false,
            escapeToClose: true,
            controllerAs: 'self',
            bindToController: true,
            hasBackdrop
        });
    }

    /**
     * Closes loader pane and switches to the previous pane if any.
     * @function closeDetails
     */
    function closeDetails() {
        stateManager.clearDisplayPanel('mainDetails');
        // FIXME: refactor fix needed
        // geoService.clearHilight();

        if (stateManager.panelHistory.find(x => x === 'mainToc')) {
            stateManager.togglePanel('mainDetails', 'mainToc');
        } else {
            stateManager.setActive({ mainDetails: false });
        }
    }
}
