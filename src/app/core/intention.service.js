/**
 * @name intentionService
 * @module app.core
 *
 * @description Load and initialize intentions
 *
 */
angular
    .module('app.core')
    .factory('intentionService', intentionService);

function intentionService(events) {
    const intentionModule = require("intention");
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
        executePreInit(intentions);
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
            const lookup = intentionModule.epsg().preInit();
            intentions.epsg.lookup = lookup;
        } else if (intentionSource.epsg !== 'none') {
            const lookup = window[intentionSource.epsg].preInit();
            intentions.epsg.lookup = lookup;
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
            if (!intentionSource[intent]) {
                break;
            } else if (intent === 'epsg') {
                setEPSGLookup(intentions);
            } else if (intentionSource[intent] === 'default') {
                preInitPromises.push(intentionModule[intent]().preInit());
            } else if (intentionSource[intent] !== 'none') {
                preInitPromises.push(window[intentionSource[intent]].preInit());
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
        for (let intent in intentionSource) {
            if (!intentionSource[intent]) {
                break;
            } else if (intentionSource[intent] === 'default') {
                intentionModule[intent]().init(mapInstance)
            } else if (intentionSource[intent] && intentionSource[intent] !== 'none') {
                window[intentionSource[intent]].init(mapInstance);
            }
        }

        events.$broadcast(events.rvIntentionsInited);
    }
}
