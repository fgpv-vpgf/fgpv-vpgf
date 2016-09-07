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

    function filterService(stateManager, geoService, $rootScope, $q, gapiService) {

        // timestamps can be watched for key changes to filter data
        const filterTimeStamps = {
            onCreated: null,
            onChanged: null,
            onDeleted: null
        };

        // a list of valid oidField values after filtering is complete
        let _validOIDs = [];

        // the numerical index of DataTables corresponding row oidField for the range filter
        let _oidColNum;

        const service = {
            setActive,
            filterTimeStamps,
            filter: {
                isActive: false
            }
        };

        _init();

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
                stateManager.display.filters.requester.legendEntry.flags.filter.visible = service.filter.isActive;

                _filteredState().then(() => {
                    filterTimeStamps.onChanged = Date.now();
                });
            }
        }

        /**
         * Initialize watchers and DataTable range filter
         *
         * @function _init
         * @private
         */
        function _init() {
            // add a DataTable filter which only accepts rows with oidField values in the _validOIDs list
            $.fn.dataTable.ext.search.push((settings, data) => _validOIDs.indexOf(parseInt(data[_oidColNum])) !== -1);

            // call _onExtentChange function when the extent has changed
            geoService.onMapReady.then(() =>
                gapiService.gapi.events.wrapEvents(geoService.mapObject, { 'extent-change': () => _onExtentChange() }));

            // DataTable is either being created or destroyed
            $rootScope.$watch(() => stateManager.display.filters.data, (val, prevVal) => {
                // triggered on DataTable panel close or switching from one layer to another
                if ((val === null && prevVal && prevVal.rows) || (val && val.rows && prevVal && prevVal.rows)) {
                    _onDestroy();
                }
                // triggered on DataTable panel open
                if (val && val.rows) {
                    _onCreate();
                }
            });
        }

        /**
         * Called when filter panel data is being added.
         *
         * @function _onCreate
         * @private
         */
        function _onCreate() {
            // add a column for symbols
            stateManager.display.filters.data.columns.unshift({
                data: 'rvSymbol',
                title: '',
                orderable: false
            });

            // recompute _oidColNum for data table filter since it may not be first index
            _oidColNum = stateManager.display.filters.data.columns.findIndex(col =>
                    col.data === stateManager.display.filters.data.oidField);

            service.filter.isActive = stateManager.display.filters.requester.legendEntry.flags.filter.visible;

            _filteredState().then(() => {
                filterTimeStamps.onCreated = Date.now();
            });
        }

        /**
         * Called when filter panel data is being removed or swapped.
         *
         * @function _onDestroy
         * @private
         */
        function _onDestroy() {
            filterTimeStamps.onDeleted = Date.now();
            filterTimeStamps.onCreated = null;
            filterTimeStamps.onChanged = null;
        }

        /**
         * Called on map extent changes. Locates updating layer and waits for updating to complete before
         * running filtering.
         *
         * @function _onExtentChange
         * @private
         * @param   {Object}    le  the active legendEntry item in the DataTable
         */
        function _onExtentChange(le = stateManager.display.filters.requester.legendEntry) {
            if (!service.filter.isActive) { // no DataTable is active - ignore
                return;
            }

            // if _layerRecord is undefined attempt to get parents
            if (typeof le._layerRecord === 'undefined') {
                return le.parent ? _onExtentChange(le.parent) : null;
            }

            // wait until layer has finished updating before filtering
            const updateWatcher = $rootScope.$watch(() => le._layerRecord._layer.updating, updating => {
                if (!updating) {
                    _filteredState().then(() => {
                        filterTimeStamps.onChanged = Date.now();
                    });
                    updateWatcher(); // remove watcher
                }
            });
        }

        /**
         * Determines the type of filters to apply and sets _validOIDs.
         *
         * @function _filteredState
         * @private
         * @return  {Promise}   resolves to undefined when the filtering is complete
         */
        function _filteredState() {
            return $q(resolve => {
                if (service.filter.isActive) {
                    _queryMapserver().then(oids => {
                        _validOIDs = oids;
                        resolve();
                    });
                } else {
                    // convert existing rows into a _validOIDs list (no filtering applied)
                    _validOIDs = stateManager.display.filters.data.rows.map(
                        row => parseInt(row[stateManager.display.filters.data.oidField])
                    );
                    resolve();
                }
            });
        }

        /**
         * Performs an ESRI query for all features with a spatial intersection with the current extent.
         *
         * @function _queryMapserver
         * @private
         * @param   {Number}    lastOID the oidField value of the last query when exceededTransferLimit is reached
         * @return  {Promise}   resolves to a list of valid oid's
         */
        function _queryMapserver(lastOID = 0) {
            const state = stateManager.display.filters;

            const queryOpts = {
                geometry: geoService.mapObject.extent,
                outFields: [state.data.oidField]
            };

            // query the layer itself instead of making a mapserver request
            if (state.requester.legendEntry.layerType === 'esriFeature') {
                queryOpts.featureLayer = state.requester.legendEntry._layerRecord._layer;

            } else {
                queryOpts.url = _queryURL(state.requester.legendEntry);
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
                    return _queryMapserver(lastOID).then(oIDs => {
                        return validOIDs.concat(oIDs); // merge recursive list with own results
                    });
                } else { // either query did not trigger a exceededTransferLimit exception, or this marks the end of the result set
                    return validOIDs;
                }
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
