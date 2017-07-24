/**
 * @module tableService
 * @memberof app.ui
 * @description
 *
 * The `tableService` is responsible for filtering DataTable results by the users current
 * extent (if enabled).
 *
 */
angular
    .module('app.ui')
    .factory('tableService', tableService);

function tableService(stateManager, geoService, $rootScope, $q, gapiService, debounceService, $rootElement, $timeout,
    layoutService, layerRegistry) {

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
            isActive: false,
            isApplied: true,
            isMapFiltered: false,
            isOpen: true
        },
        setTable,
        getTable,
        clearFilters,
        applyFilters,
        toggleSetting,
        onFilterStringChange: debounceService.registerDebounce(onFilterStringChange, 700, false),
        onFilterSelectorChange: onFilterSelectorChange,
        onFilterNumberChange: debounceService.registerDebounce(onFilterNumberChange, 700, false),
        onFilterDateChange: onFilterDateChange,
        preventSorting: preventSorting,
        filters: {},
        isFeatureLayer: false,
        isDynamicLayer: false,
        isSettingOpen: false,
        isGlobalSearch: true
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
            stateManager.display.table.data.filter.isActive = value; // set on layer so it can persist when we change layer

            // filter flag
            stateManager.display.table.requester.legendEntry.filter =
                service.filter.isActive || service.filter.isMapFiltered;

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
        $rootScope.$on('extentChange', debounceService.registerDebounce(onExtentChange, 300, false));

        // DataTable is either being created or destroyed
        $rootScope.$watch(() => stateManager.display.table.data, (val, prevVal) => {
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

        // reset all filters state to false (they will be populated by the loading table)
        filtersObject = table.columns().dataSrc();
        filtersObject.each(el => {
            service.filters[el] = false;
        });

        // recompute oidColNum for data table filter since it may not be first index
        oidColNum = stateManager.display.table.data.columns.findIndex(col =>
            col.data === stateManager.display.table.data.oidField);

        // add a DataTable filter which only accepts rows with oidField values in the validOIDs list

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
        const filters = stateManager.display.table;
        const table = service.getTable();

        // show processing
        $rootElement.find('.dataTables_processing').css('display', 'block');

        // set isApplied to hide apply filters on map button
        service.filter.isApplied = true;
        filters.data.filter.isApplied = service.filter.isApplied;  // set on layer so it can persist when we change layer

        // reset global search ($watch in filters-search.directive will remove the value)
        stateManager.display.table.data.filter.globalSearch = '_reset_';

        // reset all filters state to false
        filtersObject.each(el => {
            service.filters[el] = false;
        });

        // reset all filters value to default
        let defs = [];
        let filter = false;
        filters.data.columns.forEach(column => {
            // skip columns with no filter
            if (typeof column.filter !== 'undefined') {
                if (!column.filter.static) {
                    if (column.type === 'string') {
                        column.filter.value = '';
                        table.column(`${column.data}:name`).search('');
                    } else if (column.type === 'selector') {
                        column.filter.value = [];
                        table.column(`${column.data}:name`).search('');
                    } else if (column.type === 'number') {
                        column.filter.min = '';
                        column.filter.max = '';
                    } else if (column.type === 'date') {
                        column.filter.min = null;
                        column.filter.max = null;
                    }
                } else {
                    // if filter is static, apply the value
                    defs = getFilterDefintion(defs, column);
                    filter = true;
                }
            }
        });

        // remove filter flag is filter by extend is not active (data is not filtered)
        service.filter.isMapFiltered = false;
        filters.data.filter.isMapFiltered = service.filter.isMapFiltered;  // set on layer so it can persist when we change layer

        // get filters configuration and check if static field were used. If so, filters can't be remove and flag need to stay
        stateManager.display.table.requester.legendEntry.filter =
            service.filter.isActive || service.filter.isMapFiltered || filter;

        // if filter by extent is enable, manually trigger the on extentChange event to refresh the table
        if (service.filter.isActive) { onExtentChange(); }

        // redraw table to clear filters (use timeout for redraw so processing can show)
        $timeout(() => { table.search('').draw(); }, 100);

        // set layer defintion query
        setDefinitionExpression(filters.requester.legendEntry, defs);
    }

    /**
     * Apply filters on map
     *
     * @function applyFilters
     */
    function applyFilters() {
        const filters = stateManager.display.table;

        // set isApplied to hide apply filters on map button
        service.filter.isApplied = true;
        filters.data.filter.isApplied = service.filter.isApplied;  // set on layer so it can persist when we change layer

        // TODO: fix because we dont use flag anymore... show filter flag
        // filters.requester.legendEntry.flags.filter.visible = true;

        // loop trought all the filters to construct the array queries
        let defs = [];
        filters.data.columns.forEach(column => {
            // skip columns with no filter
            if (typeof column.filter !== 'undefined') {
                defs = getFilterDefintion(defs, column);
            }
        });

        // set layer defintion query
        setDefinitionExpression(filters.requester.legendEntry, defs);

        // set filter flag (data is filtered)
        service.filter.isMapFiltered = true;
        filters.data.filter.isMapFiltered = service.filter.isMapFiltered;  // set on layer so it can persist when we change layer
        stateManager.display.table.requester.legendEntry.filter = service.filter.isMapFiltered;
    }

    /**
     * Set the layer definition query
     *
     * @function getFilterDefintion
     * @private
     * @param   {Array}   defs   array of definition queries
     * @param   {Object}   column   column object
     * @return {Array} defs definition queries array
     */
    function getFilterDefintion(defs, column) {
        /*jshint maxcomplexity:11 */
        if (column.type === 'string') {
            // replace ' by '' to be able to perform the search in the datatable
            // relpace * wildcard and construct the query (add wildcard at the end)
            const val = column.filter.value.replace(/'/g, /''/);
            if (val !== '') {
                defs.push(`UPPER(${column.name}) LIKE \'${val.replace(/\*/g, '%').toUpperCase()}%\'`);
            }
        }

        if (column.type === 'selector') {
            const val =  column.filter.value.join(',').replace(/"/g, '\'');
            if (val !== '') {
                defs.push(`${column.name} IN (${val})`);
            }
        } else if (column.type === 'number') {
            const min = column.filter.min;
            const max = column.filter.max;

            if (min !== '') {
                defs.push(`${column.name} >= ${min}`);
            }
            if (max !== '') {
                defs.push(`${column.name} <= ${max}`);
            }
        } else if (column.type === 'date') {
            const min = column.filter.min;
            const max = column.filter.max;

            if (min !== null) {
                const dateMin = `${min.getMonth() + 1}/${min.getDate()}/${min.getFullYear()}`;
                defs.push(`${column.name} >= DATE \'${dateMin}\'`);
            }
            if (max !== null) {
                const dateMax = `${max.getMonth() + 1}/${max.getDate()}/${max.getFullYear()}`;
                defs.push(`${column.name} <= DATE \'${dateMax}\'`);
            }
        }

        return defs;
    }

    /**
     * Set the layer definition query
     *
     * @function setDefinitionExpression
     * @private
     * @param   {Object}   legendEntry   legendEntry item to get layer from
     * @param   {Array}   defs   array of definition queries to apply
     */
    function setDefinitionExpression(legendEntry, defs) {
        // stringnify the array
        const definition = defs.join(' AND ');

        // set definition query
        stateManager.display.table.requester.legendEntry.definitionQuery = definition;
    }

    /**
     * Toggle settings info section
     *
     * @function toggleSetting
     */
    function toggleSetting() {
        service.isSettingOpen = !(service.isSettingOpen);

        // show filters if setting is open
        if (service.isSettingOpen) {
            layoutService.isFiltersVisible = true;
        } else {
            // when setting is close, check if we need to show setting
            layoutService.isFiltersVisible = service.filter.isOpen;

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
     * @param   {Boolean}  [keep=false]    optional true: keep value for filter, false do not keep
     */
    function onFilterStringChange(column, value, keep = false) {
        // show processing
        $rootElement.find('.dataTables_processing').css('display', 'block');

        // generate regex then filter (use timeout for redraw so processing can show)
        const val = `^${value.replace(/\*/g, '.*')}.*$`;
        const table = service.getTable();
        $timeout(() => { table.column(`${column}:name`).search(val, true, false).draw(); }, 100);

        // keep filter state to know when to show apply map button
        setFiltersState(column, value);

        // keep filter value to reapply when table reopens
        if (keep) {
            const item = stateManager.display.table.data.columns.find(filter => column === filter.name);
            item.filter.value = value;
        }
    }

    /**
     * Apply on selector filter change callback
     *
     * @function onFilterSelectorChange
     * @param   {String}   column   column name
     * @param   {Array}   values   search filter array
     */
    function onFilterSelectorChange(column, values) {
        // join the values by | for or and remove all ". They are use to split the values
        const value = (values.length > 0) ? values.join('|').replace(/"/g, '') : '';
        onFilterStringChange(column, value);

        // keep filter value to reapply when table reopens
        const item = stateManager.display.table.data.columns.find(filter => column === filter.name);
        item.filter.value = values;
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
        // show processing
        $rootElement.find('.dataTables_processing').css('display', 'block');

        // keep filter state to know when to show apply map button
        setFiltersState(column, `${min}${max}`);

        // redraw table to filter (filters for range number are added on the table itself in table-definition.directive)
        // use timeout for redraw so processing can show
        $timeout(() => { service.getTable().draw(); }, 100);

        // keep filter value to reapply when table reopens
        const item = stateManager.display.table.data.columns.find(filter => column === filter.name);
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
        // show processing
        $rootElement.find('.dataTables_processing').css('display', 'block');

        // keep filter state to know when to show apply map button
        setFiltersState(column, `${min}${max}`);

        // redraw table to filter (filters for range date are added on the table itself in table-definition.directive)
        // use timeout for redraw so processing can show
        $timeout(() => { service.getTable().draw(); }, 100);

        // keep filter value to reapply when table reopens
        const item = stateManager.display.table.data.columns.find(filter => column === filter.name);
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
        // if there is value, assign to column and show apply map button
        // if not, it means value is '', loop trought the filters to see if we still need to show apply map button
        if (value) {
            service.filters[column] = true;
            service.filter.isApplied = false;
        } else {
            service.filters[column] = false;

            // check filter flag to know if filter is applied
            service.filter.isApplied = stateManager.display.table.requester.legendEntry.filters ? false : true;

            filtersObject.each(el => {
                // check if another field have a filter. If so, show Apply Map
                if (service.filters[el]) { service.filter.isApplied = false; }
            });
        }

        stateManager.display.table.data.filter.isApplied = service.filter.isApplied;  // set on layer so it can persist when we change layer
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
        oidColNum = stateManager.display.table.data.columns.findIndex(col =>
            col.data === stateManager.display.table.data.oidField);

        // set filter flag
        service.filter.isActive = stateManager.display.table.requester.legendEntry.filters

        // set filter extent and apply map button from table information
        const filter = stateManager.display.table.data.filter;
        service.filter.isActive = filter.isActive;
        service.filter.isApplied = filter.isApplied;
        service.filter.isMapFiltered = filter.isMapFiltered;
        service.filter.isOpen = filter.isOpen;

        // check if we need to show the filters (need this check when table is created)
        // always show filters if settings panel is open
        layoutService.isFiltersVisible = service.isSettingOpen ? true : service.filter.isOpen;

        // set layer type to see if we show apply filter button. Only works on feature/dynamic layer
        // user added layer (layer created by value from a feature collection like CSV file) does not support definition expressions and time definitions)
        // user added layer from server support definition expression and time defintion
        const layer = layerRegistry.getLayerRecord(stateManager.display.table.requester.legendEntry.layerRecordId);
        const layerType = layer.initialConfig.layerType; // stateManager.display.table.requester.legendEntry.layerType;
        service.isFeatureLayer = (layerType === 'esriFeature' && !layer.isFileLayer());
        service.isDynamicLayer = (layerType === 'esriDynamic');

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

        const layer =
            layerRegistry.getLayerRecord(stateManager.display.table.requester.legendEntry.layerRecordId)._layer;

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
                validOIDs = stateManager.display.table.data.rows.map(
                    row => parseInt(row[stateManager.display.table.data.oidField])
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
        const state = stateManager.display.table;
        const legEntry =state.requester.legendEntry;
        const layerRecId = layerRegistry.getLayerRecord(legEntry.layerRecordId);

        const queryOpts = {
            geometry: geoService.map.extent,
            outFields: [state.data.oidField]
        };

        // query the layer itself instead of making a mapserver request
        if (legEntry.parentLayerType === 'esriFeature' && legEntry.layerType === 'esriFeature') {
            queryOpts.featureLayer = layerRecId._layer;
        } else {
            queryOpts.url = legEntry.mainProxy.queryUrl;
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
                return queryMapserver(lastOID).then(oIDs => validOIDs.concat(oIDs)); // merge recursive list with own results
            } else { // either query did not trigger an exceededTransferLimit exception, or this marks the end of the result set
                return validOIDs;
            }
        });
    }
}
