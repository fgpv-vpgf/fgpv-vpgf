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

        let mApi;
        let metadataPanel;
        scope.$watch('self.appInfo.mapi', mapi => {
            if (mapi !== undefined) {
                mApi = mapi;
                metadataPanel = mapi.panels.metadata;
                setPanelContents();
            }
        });

        /** Styles and preps the meatadata panel body and header */
        function setPanelContents() {
            let closeButton = metadataPanel.header.closeButton;

            metadataPanel.body = $(`<rv-metadata-content max-text-length="250"></rv-metadata-content>`);

            metadataPanel.element.css({
                top: '0px',
                left: '400px',
                width: '350px'
            });

            createExpandButton()
        }

        /** Creates the Expand Metadata Button and appends it to the panel header*/
        function createExpandButton() {
            let expandBtn = new metadataPanel.Button(`<md-tooltip>{{ 'metadata.expand.tooltip' | translate }}</md-tooltip>
                            <md-icon md-svg-src="action:open_in_new"></md-icon>`)
            expandBtn.elem.click(() => {
                expandPanel();
            })

            expandBtn.elem.addClass('md-icon-button rv-button-24 rv-gt-sm black');
            expandBtn.elem.removeClass('md-raised')

            metadataPanel.header.append(expandBtn);
        }

        /**Creates and opens the expand metadata dialog*/
        function expandPanel() {
            let panel = mApi.panels.all.find(panel => panel.id === 'expandMetadata');
            if (panel === undefined) {
                $('#expandMetadata').remove();
                panel = mApi.panels.create('expandMetadata', 1);
                let closeButton = panel.header.closeButton;
                panel.header.title = metadataPanel.header.title;
                panel.body = `<div class='md-dialog-content'><rv-metadata-content></rv-metadata-content></div>`;
            }
            panel.open();
        }
        referenceService.panes.metadata = el;
    }
}

function Controller(stateManager, tocService, appInfo) {
    'ngInject';
    const self = this;

    self.display = stateManager.display.metadata;
    self.tocService = tocService;
    self.appInfo = appInfo;
}
