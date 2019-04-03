angular.module('app.ui').run(settingsBlock);

function settingsBlock(events) {
    let mApi = null;
    const SETTINGS_BODY_TEMPLATE = `<rv-settings><rv-content-pane<div class="rv-settings-content-panel" ></div></rv-content-pane></rv-settings>`;

    events.$on(events.rvApiPreMapAdded, (_, api) => {
        mApi = api;
        setPanelContents();
        mApi.panels.settings.allowUnderlay = false;

        // close settings panel when legend is closing
        mApi.panels.legend.closing.subscribe(() => {
            mApi.panels.settings.close();
        });

    });
    function setPanelContents() {
        const closeButton = mApi.panels.settings.header.closeButton;
        mApi.panels.settings.body = $(SETTINGS_BODY_TEMPLATE);
    }
}
