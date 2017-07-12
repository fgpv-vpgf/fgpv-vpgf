/**
 * @module identifyService
 * @memberof app.geo
 *
 * @description
 * Generates handlers for feature identification on all layer types.
 */
angular
    .module('app.geo')
    .factory('identifyService', identifyService);

function identifyService($q, configService, stateManager) {
    const service = {
        identify
    };

    return service;

    /**
     * Handles global map clicks.  Currently configured to walk through all layer records
     * and trigger service side identify queries.
     * GeoApi is responsible for performing client side spatial queries on registered
     * feature layers or server side queries for everything else.
     *
     * @function identify
     * @param {Event} clickEvent ESRI map click event which is used to run identify function
     */
    function identify(clickEvent) {
        console.log(clickEvent);

        const mapInstance = configService.getSync.map.instance;
        const opts = {
            clickEvent,
            map: mapInstance,
            geometry: clickEvent.mapPoint,
            width: mapInstance.width,
            height: mapInstance.height,
            mapExtent: mapInstance.extent
        };

        const identifyInstances = configService.getSync.map.layerRecords
            // TODO: can we expose identify on all layer record types and vet in geoapi for consistency
            .filter(layerRecord => typeof layerRecord.identify !== 'undefined')
            .map(layerRecord =>
                layerRecord.identify(opts))
            // identify function returns undefined is the layer is cannot be queries because it's not visible or for some other reason
            .filter(identifyInstance =>
                typeof identifyInstance.identifyResults !== 'undefined');

        const allIdentifyResults = [].concat(...
            identifyInstances.map(({ identifyResults }) => identifyResults));

        const allLoadingPromises = identifyInstances.map(({ identifyPromise, identifyResults }) => {
            // catch error on identify promises and store error messages to be shown in the details panel.
            const loadingPromise = identifyPromise.catch(error => {
                // add common error handling

                RV.logger.warn('identifyService', `Identify query failed with error`, error);

                identifyResults.forEach(identifyResult => {
                    // TODO: this outputs raw error message from the service
                    // we might want to replace it with more user-understandable messages
                    identifyResult.error = error.message;
                    identifyResult.isLoading = false;
                });
            });

            const infallibleLoadingPromise = makeInfalliblePromise(loadingPromise);
            return infallibleLoadingPromise;
        });

        if (allIdentifyResults.length === 0) {
            return;
        }

        const details = {
            data: allIdentifyResults,
            isLoaded: $q.all(allLoadingPromises).then(() => true)
        };

        // store the mappoint in the requester so it's possible to show a marker if there is no feature to highlight
        const requester = {
            mapPoint: clickEvent.mapPoint
        };

        // show details panel only when there is data
        stateManager.toggleDisplayPanel('mainDetails', details, requester, 0);

        /**
         * Modifies identify promises to always resolve, never reject.
         * Any errors caught will be added to the details data object.
         * Resolutions of these promises are for turning off loading indicator.
         *
         * @function makeInfalliblePromise
         * @private
         * @param  {Promise} promise [description]
         * @return {Promise}                 promise that doesn't reject
         */
        function makeInfalliblePromise(promise) {
            const modifiedPromise = $q(resolve =>
                promise
                    .then(() => resolve(true))
                    .catch(() => resolve(true))
            );

            return modifiedPromise;
        }
    }
}
