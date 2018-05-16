/**
 * @module gapiService
 * @memberof app.geo
 * @requires $q
 * @description
 *
 * The `gapi` factory exposes `geoApi` interface after it's loaded. Modules should not access `gapi` property before it's set. It's safe though since `core.run` block waits for `gapi` to be ready before kicking in the app into gear.
 *
 */
angular
    .module('app.geo')
    .factory('gapiService', gapi);

function gapi($q, globalRegistry) {
    const service = {
        gapi: null, // actual gapi interface; available after gapiPromise resovles
        isReady: null
    };

    init();

    return service;

    /***/

    /**
     * Sets `isReady` promise which is resolved when gapi loads
     * @function init
     * @private
     */
    function init() {
        // wait for `gapiPromise` from the global registry to resolve
        service.isReady = globalRegistry.gapiPromise
            .then(gapi => {
                service.gapi = gapi;
                return $q.resolve(null);
            })
            .catch((e) => {
                console.error(e);
                console.error('gapiService', 'gapi is not ready');
            });
    }
}
