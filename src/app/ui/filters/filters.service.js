(() => {
    'use strict';

    /**
     * @module filterService
     * @memberof app.ui
     * @description
     *
     * The `filterService` is responsible for filtering DataTable results by the users current
     * extent (if enabled).
     *
     */
    angular
        .module('app.ui.filters')
        .factory('filterService', filterService);

    function filterService(stateManager, geoService, $rootScope, $q, gapiService, debounceService) {

        // timestamps can be watched for key changes to filter data
        const filterTimeStamps = {
            onCreated: null,
            onChanged: null,
            onDeleted: null
        };

        // a list of valid oidField values after filtering is complete
        let validOIDs = [];

        // the numerical index of DataTables corresponding row oidField for the range filter
        let oidColNum;

        const service = {
            setActive,
            filterTimeStamps,
            filter: {
                isActive: false
            }
        };

        init();

        return service;

        /**
         * Enables/Disables filtering by extent.
         *
         * @function setActive
         * @param   {Boolean}   value   true if extent filtering is enabled, false otherwise
         */
        function setActive(value) {
            if (filterTimeStamps.onCreated !== null) { // ignore if no DataTable is active
                service.filter.isActive = value;
                // TODO: fix
                // stateManager.display.filters.requester.legendEntry.flags.filter.visible = service.filter.isActive;

                filteredState().then(() => {
                    filterTimeStamps.onChanged = Date.now();
                });
            }
        }

        /**
         * Initialize watchers and DataTable range filter
         *
         * @function init
         * @private
         */
        function init() {
            // add a DataTable filter which only accepts rows with oidField values in the validOIDs list
            $.fn.dataTable.ext.search.push((settings, data) => validOIDs.indexOf(parseInt(data[oidColNum])) !== -1);

            $rootScope.$on('extentChange', debounceService.registerDebounce(onExtentChange, 300, false));

            // DataTable is either being created or destroyed
            $rootScope.$watch(() => stateManager.display.filters.data, (val, prevVal) => {
                // triggered on DataTable panel close or switching from one layer to another
                if ((val === null && prevVal && prevVal.rows) || (val && val.rows && prevVal && prevVal.rows)) {
                    onDestroy();
                }
                // triggered on DataTable panel open
                if (val && val.rows) {
                    onCreate();
                }
            });
        }

        /**
         * Called when filter panel data is being added.
         *
         * @function onCreate
         * @private
         */
        function onCreate() {
            // recompute oidColNum for data table filter since it may not be first index
            oidColNum = stateManager.display.filters.data.columns.findIndex(col =>
                    col.data === stateManager.display.filters.data.oidField);

            // TODO: fix
            // service.filter.isActive = stateManager.display.filters.requester.legendEntry.flags.filter.visible;

            filteredState().then(() => {
                filterTimeStamps.onCreated = Date.now();
            });
        }

        /**
         * Called when filter panel data is being removed or swapped.
         *
         * @function onDestroy
         * @private
         */
        function onDestroy() {
            filterTimeStamps.onDeleted = Date.now();
            filterTimeStamps.onCreated = null;
            filterTimeStamps.onChanged = null;
        }

        /**
         * Called on map extent changes. Locates updating layer and waits for updating to complete before
         * running filtering.
         *
         * @function onExtentChange
         * @private
         */
        function onExtentChange() {
            if (!service.filter.isActive) { // no DataTable is active - ignore
                return;
            }

            const layer = stateManager.display.filters.requester.legendEntry.master ?
                stateManager.display.filters.requester.legendEntry.master._layerRecord._layer :
                stateManager.display.filters.requester.legendEntry._layerRecord._layer;

            // wait until layer has finished updating before filtering
            const stopUpdateWatcher = $rootScope.$watch(() => layer.updating, updating => {
                if (!updating) {
                    filteredState().then(() => {
                        filterTimeStamps.onChanged = Date.now();
                    });
                    stopUpdateWatcher(); // remove watcher
                }
            });
        }

        /**
         * Determines the type of filters to apply and sets validOIDs.
         *
         * @function filteredState
         * @private
         * @return  {Promise}   resolves to undefined when the filtering is complete
         */
        function filteredState() {
            return $q(resolve => {
                if (service.filter.isActive) {
                    queryMapserver().then(oids => {
                        validOIDs = oids;
                        resolve();
                    });
                } else {
                    // convert existing rows into a validOIDs list (no filtering applied)
                    validOIDs = stateManager.display.filters.data.rows.map(
                        row => parseInt(row[stateManager.display.filters.data.oidField])
                    );
                    resolve();
                }
            });
        }

        /**
         * Performs an ESRI query for all features with a spatial intersection with the current extent.
         *
         * @function queryMapserver
         * @private
         * @param   {Number}    lastOID the oidField value of the last query when exceededTransferLimit is reached
         * @return  {Promise}   resolves to a list of valid oid's
         */
        function queryMapserver(lastOID = 0) {
            const state = stateManager.display.filters;

            const queryOpts = {
                geometry: geoService.mapObject.extent,
                outFields: [state.data.oidField]
            };

            // query the layer itself instead of making a mapserver request
            if (state.requester.legendEntry.layerType === 'esriFeature') {
                queryOpts.featureLayer = state.requester.legendEntry._layerRecord._layer;

            } else {
                queryOpts.url = queryURL(state.requester.legendEntry);
            }

            // only include oidField values after previous mapserver query resulted in a exceededTransferLimit exception
            if (lastOID > 0) {
                queryOpts.where = `${state.data.oidField} > ${lastOID}`;
            }

            return gapiService.gapi.query.queryGeometry(queryOpts).then(featureSet => {
                // save an array of OID's returned by the query
                const validOIDs = featureSet.features.map(feat => parseInt(feat.attributes[state.data.oidField]));
                // transfer limit exceeded - call query again until all data is retrieved
                if (featureSet.exceededTransferLimit) {
                    // get the last oidField value to use as a starting point for another query
                    // TODO: Using the assumption that oidField values are sorted. If this turns out to be not the case,
                    // see the available ESRI methods orderByFields or start (would need to expose in geoAPI first)
                    const lastOID = featureSet.features[featureSet.features.length - 1].attributes[state.data.oidField];
                    return queryMapserver(lastOID).then(oIDs => {
                        return validOIDs.concat(oIDs); // merge recursive list with own results
                    });
                } else { // either query did not trigger an exceededTransferLimit exception, or this marks the end of the result set
                    return validOIDs;
                }
            });
        }

        /**
         * Determines the map server url for a given legendEntry. Recurse upward to parent if url is not
         * present, but keep featureIdx of first child encountered.
         *
         * @function queryURL
         * @private
         * @param   {Object}  legendEntry    the legendEntry object to derive a url
         * @param   {Number}  featureIdx     the featureIdx to use, defaults to first legendEntry's featureIdx
         */
        function queryURL(legendEntry, featureIdx = legendEntry.featureIdx) {
            return legendEntry.url ? legendEntry.url + '/' + featureIdx : queryURL(legendEntry.parent, featureIdx);
        }
    }
})();
