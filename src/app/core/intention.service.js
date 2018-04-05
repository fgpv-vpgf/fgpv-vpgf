/**
 * @name intentionService
 * @module app.core
 *
 * @description Load and initialize intentions
 *
 */

import EPSG from 'intention/epsg/epsg.intention';

angular
    .module('app.core')
    .factory('intentionService', intentionService);

function intentionService(events) {
    const service = {
        loadIntentions
    };

    return service;

    /**
     * Load and initialize requested intentions
     *
     * @function loadIntentions
     * @param {Object} intentions an Intentions object containing loading instructions
     */
    function loadIntentions(intentions) {
        // execute pre-init
        executePreInit(intentions);

        // execute init
        events.$on(events.rvMapLoaded, (_, mapInstance) => {
            executeInit(intentions.source, mapInstance);
        });
    }

    /**
     * Store the EPSG lookup function for later uses if provided
     *
     * @function setEPSGlookup
     * @param {Object} intentions an Intentions object containing loading instructions
     */
    function setEPSGLookup(intentions) {
        let intentionSource = intentions.source;

        if (intentionSource.epsg === 'default') {
            intentions.epsg.lookup = EPSG.preInit();
        } else if (intentionSource.epsg !== 'none') {
            intentions.epsg.lookup = window[intentionSource.epsg].preInit();
        }
    }

    /**
     * Pre-initialize intentions before the map is ready
     *
     * @function executePreInit
     * @param {Object} intentions an Intentions object containing loading instructions
     */
    function executePreInit(intentions) {
        let preInitPromises = [];
        let intentionSource = intentions.source;

        for (let intent in intentionSource) {
            if (intent === 'epsg') {
                setEPSGLookup(intentions);
            }
        }

        Promise.all(preInitPromises).then((values) => {
            events.$broadcast(events.rvIntentionsPreInited);
        });
    }

    /**
     * Initialize intentions after the map is ready
     *
     * @function executePreInit
     * @param {Object} intentions an Intentions object containing loading instructions
     */
    function executeInit(intentionSource, mapInstance) {
        // NOTE: Since no intentions has init() yet so will comment codes below for now
        // for (let intent in intentionSource) {
        //     if (!intentionSource[intent]) {
        //         break;
        //     } else if (intentionSource[intent] && intentionSource[intent] !== 'none') {
        //         window[intentionSource[intent]].init(mapInstance);
        //     }
        // }

        events.$broadcast(events.rvIntentionsInited);
    }
}
