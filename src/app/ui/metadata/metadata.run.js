angular.module('app.ui').run(metadataBlock);

const EXPAND_BTN_TEMPLATE = `<md-tooltip>{{ 'metadata.expand.tooltip' | translate }}</md-tooltip>
                            <md-icon md-svg-src="action:open_in_new"></md-icon>`

function metadataBlock(events) {

    let mApi = null;
    events.$on(events.rvApiPreMapAdded, (_, api) => {
        mApi = api;
        let metadataPanel = mApi.panels.metadata;
        metadataPanel.allowUnderlay = false;
        metadataPanel.body.css('overflow', 'auto');

        // close metadata when the legend is closing
        mApi.panels.legend.closing.subscribe(() => {
            mApi.panels.metadata.close();
        });

        // TODO: close metadata when table is opening

        // TODO: close table when metadata is opening
    });

}
