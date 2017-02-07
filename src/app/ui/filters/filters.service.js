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

    function filterService(stateManager, geoService, $rootScope, $q, gapiService, debounceService,
        $rootElement, $timeout) {

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
            },
            setTable,
            getTable,
            clearFilters,
            applyFilters,
            toggleSetting,
            onFilterStringChange: debounceService.registerDebounce(onFilterStringChange, 700, false),
            onFilterNumberChange: debounceService.registerDebounce(onFilterNumberChange, 700, false),
            onFilterDateChange: onFilterDateChange,
            preventSorting: preventSorting,
            filters: {},
            isApplied: true,
            isSettingOpen: false
        };

        // active table for global search to link to
        let activeTable;

        // array who contains filters (use to show/hide apply on map button)
        let filtersObject;

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
                stateManager.display.filters.requester.legendEntry.flags.filter.visible = service.filter.isActive;

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

            // show filters only when filters are in maximum view
            $rootScope.$watch(() => stateManager.state.filters.morph, (val) => {
                $rootScope.isFiltersVisible = (val === 'full' || service.isSettingOpen) ? true : false;
            });

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
         * Set active table
         *
         * @function setTable
         * @param   {Object}   table   active table
         */
        function setTable(table) {
            activeTable = table;

            const filters = table.columns().dataSrc();
            filters.shift();
            filtersObject = filters;
            filtersObject.each((el) => {
                service.filters[el] = false;
            });
        }

        /**
         * Get active table
         *
         * @function getTable
         * @return   {Object}  activeTable the active table
         */
        function getTable() {
            return activeTable;
        }

        /**
         * Clear all filters
         *
         * @function clearFilters
         */
        function clearFilters() {
            console.log('clear filters');

            // set isApplied to hide apply filters on map button
            service.isApplied = true;

            // set all filters state to false
            filtersObject.each((el) => {
                service.filters[el] = false;
            });

            applyBackdrop();
        }

        /**
         * Apply filters on map
         *
         * @function applyFilters
         */
        function applyFilters() {
            console.log('apply filters');

            // set isApplied to hide apply filters on map button
            service.isApplied = true;

            applyBackdrop();
        }

        /**
         * Toggle settings info section
         *
         * @function toggleSetting
         */
        function toggleSetting() {
            console.log('toggle filters');
            service.isSettingOpen = !(service.isSettingOpen);

            // show filters if setting is open
            if (service.isSettingOpen) {
                $rootScope.isFiltersVisible = true;
            } else {
                // when setting is close, check if we need to show setting
                $rootScope.isFiltersVisible = (stateManager.state.filters.morph === 'full') ? true : false;

                // need to recalculate scroller space because user may have switch from default to full view inside setting panel
                // need a timeout, if not measure occurs when datatable is not displayed and it fails
                $timeout(() => { activeTable.scroller.measure(); }, 0);
            }
        }

        /**
         * Apply on string filter change callback
         *
         * @function onFilterStringChange
         * @param   {String}   column   column name
         * @param   {String}   value   search filter
         */
        function onFilterStringChange(column, value) {
            console.log(`string - ${name}: ${value}`);
            setFiltersState(name, value);

            // keep filter value to reapply when table reopens
            const item = stateManager.display.filters.data.columns.find(filter => column === filter.name);
            item.filter.value = value;
        }

        /**
         * Apply on number filter change callback
         *
         * @function onFilterNumberChange
         * @param   {String}   column   column name
         * @param   {Number}   min   minimum number search filter
         * @param   {Number}   max   maximum number search filter
         */
        function onFilterNumberChange(column, min, max) {
            console.log(`number - ${column}: ${min} - ${max}`);
            setFiltersState(column, `${min}${max}`);

            // keep filter value to reapply when table reopens
            const item = stateManager.display.filters.data.columns.find(filter => column === filter.name);
            item.filter.min = min;
            item.filter.max = max;
        }

        /**
         * Apply on date filter change callback
         *
         * @function onFilterDateChange
         * @param   {String} column   column name
         * @param   {Date}   min   minimum date search filter
         * @param   {Date}   max   maximum date search filter
         */
        function onFilterDateChange(column, min, max) {
            console.log(`date - ${column}: ${min} - ${max}`);
            setFiltersState(column, `${min}${max}`);

            // keep filter value to reapply when table reopens
            const item = stateManager.display.filters.data.columns.find(filter => column === filter.name);
            item.filter.min = min;
            item.filter.max = max;
        }

        /**
         * Set filters state on filters modification to know when show/hide apply on map button
         *
         * @function setFilterState
         * @private
         * @param   {String}   column   column name
         * @param   {String}   value   search filter value
         */
        function setFiltersState(column, value) {
            if (value) {
                service.filters[column] = true;
                service.isApplied = false;
            } else {
                service.filters[column] = false;

                service.isApplied = true;
                filtersObject.each((el) => {
                    if (service.filters[el]) { service.isApplied = false; }
                });
            }

            applyBackdrop();
        }

        /**
         * Apply backdrop if filters have been modified and not apply on map
         *
         * @function applyBackdrop
         * @private
         */
        function applyBackdrop() {
            const elem = $rootElement.find('.rv-esri-map');
            if (!service.isApplied) {
                elem.css('opacity', 0.2);
            } else {
                elem.css('opacity', 1);
            }
        }

        /**
         * Prevent column sort when filter is clicked
         *
         * @function preventSorting
         * @param   {Object} event   event fired when user click or press a key on a filter
         */
        function preventSorting(event) {
            if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                event.stopPropagation(true);
                event.preventDefault(true);
            }
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

            service.filter.isActive = stateManager.display.filters.requester.legendEntry.flags.filter.visible;

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
                } else { // either query did not trigger a exceededTransferLimit exception, or this marks the end of the result set
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
