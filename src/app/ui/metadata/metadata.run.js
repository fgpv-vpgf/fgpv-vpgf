angular.module('app.ui').run(metadataBlock);

const EXPAND_BTN_TEMPLATE = `<md-tooltip>{{ 'metadata.expand.tooltip' | translate }}</md-tooltip>
                            <md-icon md-svg-src="action:open_in_new"></md-icon>`

function metadataBlock(events) {

    let mApi = null;
    const METADATA_BODY = `<rv-metadata-content max-text-length="250"></rv-metadata-content>`;
    const EXPAND_METADATA_BUTTON = `<md-tooltip>{{ 'metadata.expand.tooltip' | translate }}</md-tooltip>
                                        <md-icon md-svg-src="action:open_in_new"></md-icon>`;
    const METADATA_DIALOG_BODY = `<div class='md-dialog-content'><rv-metadata-content></rv-metadata-content></div>`;

    events.$on(events.rvApiPreMapAdded, (_, api) => {
        mApi = api;
        let metadataPanel = mApi.panels.metadata;
        setPanelContents();
        metadataPanel.allowUnderlay = false;
        metadataPanel.body.css('overflow', 'auto');

        // close metadata when the legend is closing
        mApi.panels.legend.closing.subscribe(() => {
            mApi.panels.metadata.close();
        });

        // TODO: close metadata when table is opening

        // TODO: close table when metadata is opening

        /** Styles and preps the meatadata panel body and header */
        function setPanelContents() {
            createExpandButton()
            let closeButton = metadataPanel.header.closeButton;

            metadataPanel.body = $(METADATA_BODY);

            metadataPanel.element.css({
                top: '0px',
                left: '411px',
                width: '350px'
            });
        }

        /** Creates the Expand Metadata Button and appends it to the panel header*/
        function createExpandButton() {
            let expandBtn = new metadataPanel.Button(EXPAND_METADATA_BUTTON)
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
                panel.body = METADATA_DIALOG_BODY;
            }
            panel.open();
        }
    });

}
