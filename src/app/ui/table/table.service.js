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
    referenceService, layerRegistry, configService, Geo, events) {

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
        openSettings,
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
            stateManager.display.table.requester.legendEntry.filter = service.filter.isMapFiltered;

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

        events.$on(events.rvLayerDefinitionClauseChanged, () => {
            if (filterTimeStamps.onCreated !== null) {
                filteredState().then(() => {
                    filterTimeStamps.onChanged = Date.now();
                });
            }
        });

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
        $.fn.dataTable.ext.searchTemp.push((settings, data) =>
            validOIDs.indexOf(parseInt(data[settings._colReorder.fnTranspose(oidColNum)])) !== -1);
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
                    } else if (column.type === 'rv-date') {
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

        const layerConfig = filters.requester.legendEntry.mainProxyWrapper.layerConfig;

        // store the reset filter values
        layerConfig.table.columns.forEach(column => {
            if (typeof column.filter !== 'undefined') {
                if (!column.filter.static) {
                    if (column.filter.type === 'selector') {
                        column.filter.value = [];
                    } else if (column.filter.type === 'rv-date') {
                        column.filter.value = {};
                    } else {
                        column.filter.value = '';
                    }
                }
            }
        });

        // remove filter flag if filter by extent is not active (data is not filtered)
        service.filter.isMapFiltered = false;
        filters.data.filter.isMapFiltered = service.filter.isMapFiltered;  // set on layer so it can persist when we change layer

        let config = configService.getSync.map.layerRecords.find(item =>
            item.config.id === filters.requester.legendEntry.layerRecordId).initialConfig;

        // TODO: Modify when filtering capabilities added for other layers such as WMS
        if (config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
            config = config.layerEntries.find(item => item.index === layerConfig.index)
        }

        config.table.applyMap = false;

        // most recent 'filters' were applied (no filters but no changes either)
        config.table.applied = true;

        // update the query to use on layer reload
        config.initialFilteredQuery = defs.join(' AND ');

        // get filters configuration and check if static field were used. If so, filters can't be remove and flag need to stay
        stateManager.display.table.requester.legendEntry.filter =
            service.filter.isMapFiltered || filter;

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

        const layerConfig = filters.requester.legendEntry.mainProxyWrapper.layerConfig;

        if (defs.length === 0) {
            // store the reset filter values
            layerConfig.table.columns.forEach(column => {
                if (typeof column.filter !== 'undefined') {
                    if (column.filter.type === 'selector') {
                        column.filter.value = [];
                    } else if (column.filter.type === 'rv-date') {
                        column.filter.value = {};
                    } else {
                        column.filter.value = '';
                    }
                }
            });
        }

        // set filter flag accordingly (if data is filtered)
        service.filter.isMapFiltered = defs.length > 0;
        filters.data.filter.isMapFiltered = service.filter.isMapFiltered;  // set on layer so it can persist when we change layer

        let config = configService.getSync.map.layerRecords.find(item =>
            item.config.id === filters.requester.legendEntry.layerRecordId).initialConfig;

        // TODO: Modify when filtering capabilities added for other layers such as WMS
        if (config.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
            config = config.layerEntries.find(item => item.index === layerConfig.index)
        }

        // most recent 'filters' were applied (either no filters and no changes or updated filters applied)
        config.table.applyMap = config.table.applied = true;

        stateManager.display.table.requester.legendEntry.filter = service.filter.isMapFiltered;

        // update the query to use on layer reload
        config.initialFilteredQuery = defs.join(' AND ');
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
    // eslint-disable-next-line complexity
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
        } else if (column.type === 'rv-date') {
            const min = column.filter.min;
            const max = column.filter.max;

            if (min) {
                const dateMin = `${min.getMonth() + 1}/${min.getDate()}/${min.getFullYear()}`;
                defs.push(`${column.name} >= DATE \'${dateMin}\'`);
            }
            if (max) {
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
     * Open settings info section
     *
     * @function openSettings
     */
    function openSettings() {
        service.isSettingOpen = !service.isSettingOpen;

        // show filters if setting is open
        if (service.isSettingOpen) {
            referenceService.isFiltersVisible = true;
        } else {
            // when setting is close, check if we need to show setting
            referenceService.isFiltersVisible = service.filter.isOpen;

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

        const configTable = stateManager.display.table.requester.legendEntry.mainProxyWrapper.layerConfig.table;

        // keep filter value to reapply when table reopens
        configTable.columns.find(filter => column === filter.data).filter.value = value;

        // changes made to filter, show Apply Map button
        configTable.applyMap = configTable.applied = false;
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

        const configTable = stateManager.display.table.requester.legendEntry.mainProxyWrapper.layerConfig.table;

        // keep filter value when reloading layer
        configTable.columns.find(filter => column === filter.data).filter.value = values;

        // changes made to filter, show Apply Map button
        configTable.applyMap = configTable.applied = false;
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

        const configTable = stateManager.display.table.requester.legendEntry.mainProxyWrapper.layerConfig.table;

        // keep filter value when reloading layer
        configTable.columns.find(filter => column === filter.data).filter.value = `${min},${max}`;

        // changes made to filter, show Apply Map button
        configTable.applyMap = configTable.applied = false;
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

        const configTable = stateManager.display.table.requester.legendEntry.mainProxyWrapper.layerConfig.table;

        // keep filter value when reloading layer
        configTable.columns.find(filter => column === filter.data).filter.value = {
            min: min,
            max: max
        };

        // changes made to filter, show Apply Map button
        configTable.applyMap = configTable.applied = false;
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
        // if not, it means value is '', loop through the filters to see if we still need to show apply map button
        if (value) {
            service.filters[column] = true;
            service.filter.isApplied = false;
        } else {
            service.filters[column] = false;

            // check filter flag to know if filter is applied
            service.filter.isApplied = stateManager.display.table.requester.legendEntry.filters ? false : true;

            let flag = false;

            filtersObject.each(el => {
                // check if another field have a filter. If so, show Apply Map
                if (service.filters[el]) {
                    flag = true;
                    service.filter.isApplied = false;
                }
            });

            // if flag is still false, no other field has a filter, so all filters have been cleared on table
            // show Apply Map button to be able to clear all filters on the map as well
            if (flag === false) {
                service.filter.isApplied = false;
            }
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
        referenceService.isFiltersVisible = service.isSettingOpen ? true : service.filter.isOpen;

        // set layer type to see if we show apply filter button. Only works on feature/dynamic layer
        // user added layer (layer created by value from a feature collection like CSV file) does not support definition expressions and time definitions)
        // user added layer from server support definition expression and time defintion
        const layer = layerRegistry.getLayerRecord(stateManager.display.table.requester.legendEntry.layerRecordId);
        const layerType = layer.initialConfig.layerType; // stateManager.display.table.requester.legendEntry.layerType;
        service.isFeatureLayer = (layerType === Geo.Layer.Types.ESRI_FEATURE && !layer.isFileLayer());
        service.isDynamicLayer = (layerType === Geo.Layer.Types.ESRI_DYNAMIC);

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
        if (!service.filter.isActive || !stateManager.display.table.requester) { // filter by extent disabled or no DataTable is active - ignore
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
     * Applies validOIDs returned from queryMap or all oids if no query is applied.
     *
     * @function filteredState
     * @private
     * @return  {Promise}   resolves to undefined when the filtering is complete
     */
    function filteredState() {
        const layerRecId = layerRegistry.getLayerRecord(stateManager.display.table.requester.legendEntry.layerRecordId);

        // we're not filtering by either symbology or extent, so resolve with all oid's as valid
        if (!service.filter.isActive && typeof layerRecId.definitionClause !== 'string') {
            validOIDs = stateManager.display.table.data.rows.map(row => parseInt(row[stateManager.display.table.data.oidField]));
            return $q.resolve();
        }

        return queryMapserver().then(oids => (validOIDs = oids));
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
        const legEntry = state.requester.legendEntry;
        const layerRecId = layerRegistry.getLayerRecord(legEntry.layerRecordId);

        const filterByExtent = service.filter.isActive;
        const filterBySymbology = typeof layerRecId.definitionClause === 'string';

        const queryOpts = { outFields: [state.data.oidField] };
        if (filterByExtent) {
            queryOpts.geometry = geoService.map.extent;
        }

        // query the layer itself instead of making a mapserver request
        if (legEntry.parentLayerType === 'esriFeature' && legEntry.layerType === 'esriFeature' && layerRecId.isFileLayer()) {
            queryOpts.featureLayer = layerRecId._layer;         // file based layer
        } else {
            queryOpts.url = legEntry.mainProxy.queryUrl;        // server based layer
        }

        // only include oidField values after previous mapserver query resulted in a exceededTransferLimit exception
        if (lastOID > 0) {
            queryOpts.where = `(${state.data.oidField} > ${lastOID})`;

            if (filterBySymbology) {
                queryOpts.where += ` AND `;
            }
        } else {
            queryOpts.where = ''; // this is needed for our string concatenation below, else its undefined
        }


        if (filterBySymbology) {
            queryOpts.where += `(${layerRecId.definitionClause})`;
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
