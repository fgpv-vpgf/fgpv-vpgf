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
        let intentionObj = intentions.source;

        if (intentionObj.epsg === 'default') {
            intentions.epsg.lookup = EPSG.preInit();
        } else if (intentionObj.epsg !== 'none') {
            intentions.epsg.lookup = window[intentionObj.epsg].preInit();
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
        let intentionObj = intentions.source;

        for (let intent in intentionObj) {
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
     * @param {Object} intentionObj an Intentions object containing loading instructions
     * @param {object} mapInstance map instance of RAMP
     */
    function executeInit(intentionObj, mapInstance) {
        for (let intent in intentionObj) {
            if (!intentionObj[intent] || intent === 'epsg') {
                break;
            } else if (intentionObj[intent] !== 'default' || intentionObj[intent] !== 'none') {
                window[intentionObj[intent]].init(mapInstance);
            }
        }

        events.$broadcast(events.rvIntentionsInited);
    }
}
