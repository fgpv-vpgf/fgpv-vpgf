/* global RV */

angular
    .module('app.core')
    .run(runBlock);

/**
 * @function runBlock
 * @private
 * @memberof app.core
 * @description
 *
 * The `runBlock` triggers config and locale file loading, sets language of the app.
 */
function runBlock($rootScope, $rootElement, $q, reloadService, events, configService,
        gapiService, appInfo) {

    const promises = [
        configService.initialize(),
        gapiService.isReady
    ];

    // wait on the config and geoapi
    $q.all(promises)
        .then(() => {
            readyDelay();
        })
        .catch(reason => {
            RV.logger.error('runBlock', 'fatal error', reason);
        });

    $rootScope.uid = uid;

    /********************/

    /**
     * Waits on bookmark to modify the config if needed
     *
     * @function readyDelay
     * @private
     */
    function readyDelay() {
        const waitAttr = $rootElement.attr('rv-wait');

        if (typeof waitAttr !== 'undefined') {
            reloadService.bookmarkBlocking = true;
            const deRegister = $rootScope.$on(events.rvBookmarkInit, () => {
                $rootScope.$broadcast(events.rvReady);
                deRegister(); // de-register `rvBookmarkInit` listener to prevent broadcasting `rvReady` in the future
            });
        } else {
            $rootScope.$broadcast(events.rvReady);
        }
    }

    /**
     * A helper function to create ids for template elements inside directives.
     * Should be called with a scope id and an optional suffix if several different ids needed inside a single directive (each scope has a different id).
     * Adding `{{ ::$root.uid($id) }}` inside a template will return a `{appid}-{scopeid}` string. If this used several times inside a single template, the same id is returned, so you don't have to store it to reuse. Don't forget a one-time binding.
     * @function uid
     * @private
     * @param {String|Number} id
     * @return {String|Number} suffix [optional]
     */
    function uid(id, suffix) {
        suffix = suffix ? `-${suffix}` : '';
        return `${appInfo.id}-id-${id}${suffix}`;
    }
}
