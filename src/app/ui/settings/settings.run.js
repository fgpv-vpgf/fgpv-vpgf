angular.module('app.ui').run(settingsBlock);

function settingsBlock(events) {
    let mApi = null;
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
        mApi.panels.settings.element.css({
            top: '0px',
            left: '400px',
            width: '350px'
        });
        let closeButton = mApi.panels.settings.header.closeButton;
        mApi.panels.settings.body = $('<rv-settings></rv-settings>');
    }
}
