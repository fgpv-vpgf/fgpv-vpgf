angular.module('app.ui').run(settingsBlock);

function settingsBlock(events: any) {
    let mApi: any = null;
    events.$on(events.rvApiPreMapAdded, (_: any, api: any) => {
        mApi = api;
        setPanelContents();

        // close settings panel when legend is closing
        mApi.panels.legend.closing.subscribe(() => {
            mApi.panels.settings.close();
        });

        // close settings when metadata is opening
        mApi.panels.metadata.opening.subscribe(() => {
            mApi.panels.settings.close();
        });
    });

    function setPanelContents() {
        mApi.panels.settings.element.css({
            top: '0px',
            left: '410px',
            width: '350px'
        });
        mApi.panels.settings.header.closeButton;
        mApi.panels.settings.body = $('<rv-settings></rv-settings>');
    }
}
