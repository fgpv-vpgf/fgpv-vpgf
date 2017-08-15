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
        
        // show details panel only when there is data
        stateManager.toggleDisplayPanel('mainDetails', {
            data: ['HELLO'],
            isLoaded: Promise.resolve(true)
        }, {mapPoint: clickEvent.mapPoint}, 0);


    }
}
