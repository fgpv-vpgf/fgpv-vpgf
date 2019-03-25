angular.module('app.ui').run(settingsBlock);

function settingsBlock(events: any) {
    let mApi: any = null;
    events.$on(events.rvApiPreMapAdded, (_: any, api: any) => {
        mApi = api;
        //TODO: move header and close button to proper part of panel, add CSS so panel isn't a dialog
        mApi.panels.settings.body = $('<rv-settings></rv-settings>');
        mApi.panels.legend.closing.subscribe(() => {
            mApi.panels.settings.close();
        });
    });
}
