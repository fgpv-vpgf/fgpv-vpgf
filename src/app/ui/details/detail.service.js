const templateUrl = require('./details-modal.html');

/**
 * @module detailService
 * @memberof app.ui
 * @description
 *
 * The `detailService` is responsible over detailed layer views
 *
 */
angular.module('app.ui').factory('detailService', detailService);

const parserFunctions = [];
const templates = [];

function detailService($mdDialog, stateManager, mapService, referenceService, events) {
    const service = {
        expandPanel,
        closeDetails,
        getParser,
        getTemplate
    };

    events.$on(events.rvApiPreMapAdded, (_, api) => {
        api.panels.details.body = $('<rv-details></rv-details>');

        const expandBtn = new api.panels.details.Button(`<md-icon md-svg-src="action:open_in_new"></md-icon>`);
        expandBtn.$
            .addClass('md-icon-button')
            .removeClass('md-raised')
            .on('click', () => { expandPanel(); });
        api.panels.details.header.append(expandBtn);

        const btn = api.panels.details.header.closeButton;
        btn.on('click', () => { closeDetails(); });

        api.panels.details.header.title = stateManager.display.details.selectedItem ? stateManager.display.details.selectedItem.requester.proxy.name : (stateManager.display.details.isLoading ? 'details.label.searching' : 'details.label.noresult');

        api.panels.details.opening.subscribe( () => {
            api.mapI.setAppbarTitle(api.panels.details, 'appbar.tooltip.pointInfo');
        });
        api.panels.details.closing.subscribe(() => {
            api.mapI.releaseAppbarTitle(api.panels.details);
        })
    });

    events.$on(events.rvApiMapAdded, (_, api) => {
        service.mApi = api;
    });

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
            parent: referenceService.panels.shell,
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

        // remove highlighted features and the haze when the details panel is closed
        mapService.clearHighlight(false);

        if (stateManager.panelHistory.find(x => x === 'mainToc')) {
            stateManager.togglePanel('mainDetails', 'mainToc');
        } else {
            stateManager.setActive({ mainDetails: false });
        }
    }

    function getParser(layerId, parserUrl) {
        return new Promise(resolve => {
            if (parserFunctions[layerId]) {
                resolve(parserFunctions[layerId]);
            } else {
                $.ajax({ method: 'GET', dataType: 'text', url: parserUrl }).then(data => {
                    let f = `(${data})`;
                    parserFunctions[layerId] = f;

                    resolve(f);
                });
            }
        });
    }

    function getTemplate(layerId, templatePath) {
        return new Promise(resolve => {
            if(templates[layerId]) {
                resolve(templates[layerId]);
            } else {
                $.ajax({ method: 'GET', dataType: 'text', url: templatePath }).then(data => {
                    templates[layerId] = data;

                    resolve(data);
                });
            }
        })
    }
}
