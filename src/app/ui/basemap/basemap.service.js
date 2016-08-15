(() => {
    'use strict';

    /**
     * @module basemapService
     * @memberof app.ui.basemap
     * @description
     *
     * The `basemapService` is responsible for the providing a list of selectable basemaps, and tracking
     * the currently selected basemap.
     *
     */
    angular
        .module('app.geo')
        .factory('basemapService', basemapService);

    function basemapService($rootScope, events, configService, $translate, geoService, $injector, $q) {

        let bmSelected = {}; // the current selected basemap
        let config;

        const projections = [];
        const projPromise = $q.defer(); // resolves when all projections are ready for display
        const service = {
            select,
            projections: projPromise.promise,
            getSelected
        };

        // start loading basemaps into projections once map and config are ready
        $rootScope.$on(events.rvReady, () => configService.getCurrent().then(conf => {
            config = conf;
            _addBaseMaps(config.baseMaps.slice()); // shallow copy the config array
        }));

        return service;

        /**
         * Set the provided basemap as selected and update the map
         *
         * @function select
         * @param {Object} basemap   the basemap object to set as selected
         */
        function select(basemap) {
            bmSelected.selected = false; // set current basemap to unselected
            bmSelected = basemap;
            bmSelected.selected = true;

            if (geoService.baseMapHasSameSP(basemap.id)) {
                geoService.selectBasemap(basemap.id);
            } else {
                // avoiding circular dependency on bookmarkService
                $injector.get('reloadService').loadNewProjection(basemap.id);
            }
        }

        /**
         * Get the currently selected basemap
         *
         * @function getSelected
         * @returns {Object}    the basemap that is currently selected
         */
        function getSelected() {
            return bmSelected;
        }

        /**
         * Organizes basemaps into projection groupings and inserts a blank basemap
         *
         * @function _addBaseMaps
         * @private
         * @param {Array} basemapList   A list of basemap objects
         */
        function _addBaseMaps(basemapList) {
            // no more basemaps to process
            if (basemapList.length === 0) {
                bmSelected.selected = true;
                projPromise.resolve(projections);
                return;
            }

            const basemap = _normalizeBasemap(basemapList.pop());
            const projName = _wkidToProjectionName(basemap.wkid);
            let projection = projections.find(proj => proj.name === projName);
            // create projection if one does not already exist
            if (!projection) {
                projection = {
                    wkid: basemap.wkid,
                    name: projName,
                    basemaps: [{ // create with a blank basemap
                        name: $translate.instant('basemap.blank.title'),
                        description: $translate.instant('basemap.blank.desc'),
                        type: 'blank',
                        id: 'blank_basemap_' + basemap.wkid,
                        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7/',
                        wkid: basemap.wkid,
                        selected: false
                    }]
                };
                projections.unshift(projection);
            }

            basemap.selected = config.map && config.map.initialBasemapId === basemap.id;
            bmSelected = bmSelected.selected ? bmSelected.selected : basemap;
            projection.basemaps.unshift(basemap);
            _addBaseMaps(basemapList); // recursive - keep going until no basemaps remain
        }
    }

    /**
     * Converts a basemap wkid to a projection string name representation
     *
     * @function _wkidToProjectionName
     * @private
     * @returns {String}    the projection string name representation
     */
    function _wkidToProjectionName(wkid) {
        return (wkid === 3978) ? 'Lambert' : (wkid === 102100) ? 'Mercator' : 'Other';
    }

    /**
     * Overwrites and adds properties to the basemap object provided by the config
     *
     * @function _normalizeBasemap
     * @private
     * @returns {Object}    the basemap object
     */
    function _normalizeBasemap(basemap) {
        return {
            name: basemap.name,
            description: basemap.description,
            type: basemap.type,
            id: basemap.id,
            url: basemap.layers[0].url,
            wkid: basemap.wkid,
            selected: false
        };
    }
})();
