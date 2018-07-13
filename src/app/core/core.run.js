angular
    .module('app.core')
    .run(runBlock);

function runBlock($rootScope, events, configService) {

    // initialize config service
    configService.initialize();

    // wait on the config and geoapi
    events.$on(events.rvCfgInitialized, () => $rootScope.$broadcast(events.rvReady));
}
