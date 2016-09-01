/* global esri */
(() => {
    'use strict';

    /**
     * @module filterService
     * @memberof app.ui
     * @description
     *
     * The `filterService` is responsible for providing a list of selectable basemaps, and tracking
     * the currently selected basemap.
     *
     */
    angular
        .module('app.ui.filters')
        .factory('filterService', filterService);

    function filterService(stateManager, geoService, $rootScope, $q) {
        // state object with filtering applied
        let finalState;
        // tracks state of filter panel for internal optimization
        let _isActive = false;
        // provides timestamps when row data has been recently updated/deleted
        const rowData = {
            changed: Date.now(),
            deleted: Date.now()
        };

        _init();

        return {
            rowData,
            getState
        };

        /**
         * Returns the filters state object after filtering has been applied
         *
         * @function getState
         * @returns {Object}    the filters state object with filtering applied
         */
        function getState() {
            return finalState;
        }

        /**
         * Initialize various watchers which trigger filtering
         *
         * @function _init
         * @private
         */
        function _init() {
            // triggers when layer selection is changing
            $rootScope.$watch(() => stateManager.display.filters.data, (val, prevVal) => {
                // layer data is being opened
                if (val && val.rows) {
                    _isActive = true;
                    _filteredState();
                // layer data is being removed (panel closing or changing layers)
                } else if (prevVal && prevVal.data !== null) {
                    _isActive = false;
                    rowData.deleted = Date.now();
                }
            });

            // triggers when map extent is changing
            $rootScope.$watch(() => geoService.mapObject && geoService.mapObject.extent,
            (currentExtent, prevExtent) => {
                if (typeof prevExtent === 'object' && _isActive) { // only track when panel is active
                    _filteredState();
                }
            });

            // triggers when layer filter flag is toggled
            $rootScope.$watch(() =>
                stateManager.display.filters.requester &&
                stateManager.display.filters.requester.legendEntry.flags.filterExtent.visible,

            (isVisible, priorVisibility) => {
                if (typeof priorVisibility === 'boolean' && _isActive) { // only track when panel is active
                    _filteredState();
                }
            });
        }

        /**
         * Determines and applies row filtering. Once resolved, the 'finalState' variable contains the
         * filtered state.
         *
         * Currently, if the layer has its 'filterExtent' flag to visible we request an extent filter (see below),
         * otherwise we simply resolve with the unmodified state.
         *
         * @function _filteredState
         * @private
         * @returns {Promise}    resolves as undefined when all filtering is complete
         */
        function _filteredState() {
            const aPromise = $q(resolve => {
                if (stateManager.display.filters.requester &&
                    stateManager.display.filters.requester.legendEntry.flags.filterExtent.visible) {
                    _queryMapserver(resolve);
                } else {
                    resolve(stateManager.display.filters);
                }
            });

            aPromise.then(state => {
                finalState = state;
                rowData.changed = Date.now();
            });

            return aPromise;
        }

        /**
         * Performs an ESRI query for all features with a spatial intersection with the current extent.
         * Resolves with a state copy which contains only the rows found in the query.
         *
         * @function _queryMapserver
         * @private
         * @param   {Function}  resolver    a function which resolves a promise
         */
        function _queryMapserver(resolver) {
            const state = stateManager.display.filters;
            const filteredState = angular.copy(state); // so original state is preserved

            // create and set the esri query parameters
            const queryTask = new esri.tasks.QueryTask(_queryURL(state.requester.legendEntry));
            const query = new esri.tasks.Query();
            query.outSpatialReference = { wkid:102100 };
            query.returnGeometry = false;
            query.outFields = [state.data.oidField];
            query.geometry = geoService.mapObject.extent;
            query.spatialRelationship = 'esriSpatialRelIntersects';

            // issue the map server request with a callback function when complete
            queryTask.execute(query, featureSet => {
                // create an array of OID's returned by the query
                const validOIDs = featureSet.features.map(feat => feat.attributes[state.data.oidField]);
                // only state rows with an OID in validOIDs is kept
                filteredState.data.rows = state.data.rows.filter(row =>
                    validOIDs.indexOf(row[state.data.oidField]) !== -1);
                // filtering complete, resolve with the filtered state copy
                resolver(filteredState);
            });
        }

        /**
         * Determines the map server url for a given legendEntry. Recurse upward to parent if url is not
         * present, but keep featureIdx of first child encountered.
         *
         * @function _queryURL
         * @private
         * @param   {Object}  legendEntry    the legendEntry object to derive a url
         * @param   {Number}  featureIdx     the featureIdx to use, defaults to first legendEntry's featureIdx
         */
        function _queryURL(legendEntry, featureIdx = legendEntry.featureIdx) {
            return legendEntry.url ? legendEntry.url + '/' + featureIdx : _queryURL(legendEntry.parent, featureIdx);
        }
    }
})();
