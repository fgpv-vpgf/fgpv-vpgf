(() => {
    'use strict';
    const wkidTypes = {
        3978: 'Lambert',
        102100: 'Mercator'
    };
    const wkidNames = wkid => wkid in wkidTypes ? wkidTypes[wkid] : 'Other';

    /**
     * @module basemapService
     * @memberof app.ui
     * @description
     *
     * The `basemapService` is responsible for providing a list of selectable basemaps, and tracking
     * the currently selected basemap.
     *
     */
    angular
        .module('app.geo')
        .factory('basemapService', basemapService);

    function basemapService($rootScope, events, configService, $translate, $injector) {

        let bmSelected; // the current selected basemap
        let initialBasemapId;
        const onChangeCallback = [];
        const projections = [];
        const service = {
            select,
            getSelected,
            reload,
            setOnChangeCallback
        };

        return service;

        /**
         * Sets a callback function that is called whenever basemaps changes.
         *
         * @function setOnChangeCallback
         * @param {Function} cb   a callback function which takes an optional parameter containing
         *                        the list of projections
         */
        function setOnChangeCallback(cb) {
            onChangeCallback.push(cb);
        }

        /**
         * Rebuilds the list of basemaps and projections based on the current configuration.
         * @function reload
         */
        function reload() {
            projections.length = 0;
            configService.getCurrent().then(conf => {
                initialBasemapId = conf.map ? conf.map.initialBasemapId : null;
                _addBaseMaps(conf.baseMaps);
            });
        }

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

            if ($injector.get('geoService').baseMapHasSameSP(basemap.id)) { // avoid circular dependency
                $injector.get('geoService').selectBasemap(basemap.id); // avoid circular dependency
            } else {
                // avoiding circular dependency on bookmarkService
                $injector.get('reloadService').loadNewProjection(basemap.id); // avoid circular dependency
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

            basemapList.forEach(bm => {
                const basemap = _normalizeBasemap(bm);
                const projName = wkidNames(basemap.wkid);
                let projection = projections.find(proj => proj.name === projName);
                // make first basemap selected by default
                bmSelected = typeof bmSelected === 'undefined' ? basemap : bmSelected;
                // create projection if one does not already exist
                if (!projection) {
                    projection = {
                        wkid: basemap.wkid,
                        name: projName,
                        basemaps: []
                    };
                    projections.push(projection);
                }

                // if config specifies a default basemap set to selected
                basemap.selected = initialBasemapId === basemap.id;
                bmSelected = basemap.selected ? basemap : bmSelected;

                projection.basemaps.push(basemap);
            });

            projections.forEach(p => p.basemaps.push({
                name: $translate.instant('basemap.blank.title'),
                description: $translate.instant('basemap.blank.desc'),
                type: 'blank',
                id: 'blank_basemap_' + p.basemaps[0].wkid,
                url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7/',
                wkid: p.basemaps[0].wkid,
                selected: false
            }));

            bmSelected.selected = true;
            onChangeCallback.forEach(cb => cb(projections, bmSelected));
        }
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
