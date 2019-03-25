angular.module('app.ui').run(metadataBlock);

const EXPAND_BTN_TEMPLATE = `<md-tooltip>{{ 'metadata.expand.tooltip' | translate }}</md-tooltip>
                            <md-icon md-svg-src="action:open_in_new"></md-icon>`

const EXPANDED_METADATA_TEMPLATE = `<rv-metadata-content></rv-metadata-content>`

function metadataBlock(events) {

    let mApi = null;
    events.$on(events.rvApiPreMapAdded, (_, api) => {
        mApi = api;
        let metadataPanel = mApi.panels.metadata;
        setPanelContents(metadataPanel);
        metadataPanel.body.css('overflow', 'auto');


        // close metadata when the legend is closing
        mApi.panels.legend.closing.subscribe(() => {
            mApi.panels.metadata.close();
        });

        // reset metadata body on close
        mApi.panels.metadata.closing.subscribe(() => {
            mApi.panels.metadata.body = $(EXPANDED_METADATA_TEMPLATE);
        });

        // close metadata when settings is opening
        mApi.panels.settings.opening.subscribe(() => {
            mApi.panels.metadata.close();
        });

        // TODO: close metadata when table is opening

        // TODO: close table when metadata is opening
    });

    /**Creates and opens the expand metadata dialog*/
    function expandPanel(metadataPanel) {
        let panel = mApi.panels.all.find(panel => panel.id === 'expand-metadata');
        if (panel === undefined) {
            $('#expand-metadata').remove();
            panel = mApi.panels.create('expand-metadata');
            let closeButton = panel.header.closeButton;
            panel.header.title = metadataPanel.header.title;
            panel.body = EXPANDED_METADATA_TEMPLATE;
            panel.body.css('overflow', 'auto');
        }
        panel.open(true);
    }

    /**Creates the expand button that is used as the metadata panel control*/
    function createExpandButton(metadataPanel) {
        let expandBtn = new metadataPanel.Button(EXPAND_BTN_TEMPLATE)
        expandBtn.elem.click(() => {
            expandPanel(metadataPanel);
        })

        expandBtn.elem.addClass('md-icon-button rv-button-24 rv-gt-sm black');
        expandBtn.elem.removeClass('md-raised')

        metadataPanel.header.append(expandBtn);
    }

    /**Sets the metadata panel contents*/
    function setPanelContents(metadataPanel) {
        createExpandButton(metadataPanel)
        let closeButton = metadataPanel.header.closeButton;

        mApi.panels.metadata.body = $(EXPANDED_METADATA_TEMPLATE);
        mApi.panels.metadata.element.css({
            top: '0px',
            left: '410px',
            width: '350px'
        });

    }

}
