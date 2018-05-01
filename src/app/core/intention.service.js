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

function intentionService(events, $rootScope) {
    const service = {
        preInitialize,
        initialize
    };

    return service;

    /**
     * Pre-initialize intentions before the map is ready
     *
     * @function preInitialize
     * @param {Object} intentions an Intentions object containing loading instructions
     */
    function preInitialize(intentions) {
        let instructions = intentions.instructions;

        // signal for all intentions have been pre-inited
        events.$on([events.rvEPSGPreInited], ()=> {
            events.$broadcast(events.rvIntentionsPreInited);
        });

        // pre-initialize all available intentions
        for (let intent in instructions) {
            if (intent === 'epsg') {
                if (instructions.epsg === 'default') {
                    epsgPreInit(EPSG);
                } else if (instructions.epsg !== 'none') {
                    epsgPreInit(window[instructions.epsg]);
                } else {
                    events.$broadcast(events.rvEPSGPreInited);
                }
            }
        }

        /**
         * Pre-initialize EPSG lookup intention
         *
         * @function epsgPreInit
         * @param {Object} intent an Intent object returned by the intention
         */
        function epsgPreInit(intent) {
            const lookup = intent.preInit();
            if (typeof lookup === 'function') {
                intentions.epsg.lookup = lookup;
                console.log('Intention: epsg pre-initialized');
                events.$broadcast(events.rvEPSGPreInited);
            } else {
                intent.preInit().then(lookup => {
                    intentions.epsg.lookup = lookup;
                    console.log('Intention: epsg pre-initialized');
                    events.$broadcast(events.rvEPSGPreInited);
                });
            }
        }
    }

    /**
     * Initialize intentions after the map is ready
     *
     * @function initialize
     * @param {Object} intentions an Intentions object containing loading instructions
     * @param {object} mapi map instance of RAMP
     */
    function initialize(intentions, mapi) {
        let instructions = intentions.instructions;

        // initialize all available intentions
        for (let intent in instructions) {
            if (intent === 'epsg') {
                if (instructions.epsg === 'default') {
                    epsgInit(EPSG);
                } else if (instructions.epsg !== 'none') {
                    epsgInit(window[instructions.epsg]);
                }
            }
        }

        events.$broadcast(events.rvIntentionsInited);

        /**
         * initialize EPSG lookup intention
         *
         * @function epsgInit
         * @param {Object} intent an Intent object returned by the intention
         */
        function epsgInit(intent) {
            if (intent.init !== undefined) {
                intent.init(mapi);
                console.log('Intention: epsg initialized');
            }
        }
    }
}
