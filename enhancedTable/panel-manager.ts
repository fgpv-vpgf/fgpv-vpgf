import { Grid } from 'ag-grid-community';
import { SEARCH_TEMPLATE, MENU_TEMPLATE, CLEAR_FILTERS_TEMPLATE, COLUMN_VISIBILITY_MENU_TEMPLATE, MOBILE_MENU_TEMPLATE, MOBILE_MENU_BTN_TEMPLATE, RECORD_COUNT_TEMPLATE, APPLY_TO_MAP_TEMPLATE } from './templates';
import { DetailsAndZoomButtons } from './details-and-zoom-buttons';
import 'ag-grid-community/dist/styles/ag-grid.css';
import './main.scss';
import { PanelRowsManager } from './panel-rows-manager';
import { PanelStatusManager } from './panel-status-manager';
import { scrollIntoView, tabToGrid } from './grid-accessibility';
import { ConfigManager, ColumnConfigManager } from './config-manager';
import { PanelStateManager } from './panel-state-manager';
import { PRINT_TABLE } from './templates'

/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
export class PanelManager {

    constructor(mapApi: any) {
        this.notVisible = {}
        this.mapApi = mapApi;
        this.tableContent = $(`<div rv-focus-exempt></div>`);
        this.panel = this.mapApi.createPanel('enhancedTable');
        this.setSize();
        this.panel.panelBody.addClass('ag-theme-material');
        this.panel.setBody(this.tableContent);
        this.panel.element[0].setAttribute('type', 'table');
        this.panel.element[0].classList.add('default');
        this.panel.element[0].addEventListener('focus', (e: any) => scrollIntoView(e, this.panel.element[0]), true);

        // Enhance panel's close function so panel close button destroys table properly
        let close = this.panel.close.bind(this.panel);
        this.panel.close = () => {
            this.panel.element[0].removeEventListener('focus', (e: any) => scrollIntoView(e, this.panel.element[0]), true);
            this.gridBody.removeEventListener('focus', (e: any) => tabToGrid(e, this.tableOptions, this.lastFilter), false);
            this.panelRowsManager.destroyObservers();
            this.currentTableLayer = undefined;
            close();
        }

        // add mobile menu to the dom
        let mobileMenuTemplate = $(MOBILE_MENU_TEMPLATE)[0];
        this.mobileMenuScope = this.mapApi.$compile(mobileMenuTemplate);
        this.panel.panelControls.after(mobileMenuTemplate);

        // Add the scroll record count if it hasn't been added yet
        let recordCountTemplate = $(RECORD_COUNT_TEMPLATE);
        this.recordCountScope = this.mapApi.$compile(recordCountTemplate);
        this.panel.panelControls.after(recordCountTemplate);
    }

    // recursively find and set the legend block for the layer
    setLegendBlock(legendEntriesList: any) {
        legendEntriesList.forEach(entry => {
            if (entry.proxyWrapper !== undefined && this.currentTableLayer._layerProxy === entry.proxyWrapper.proxy) {
                this.legendBlock = entry;
            }
            else if (entry.children || entry.entries) {
                this.setLegendBlock(entry.children || entry.entries);
            }
        });
    }

    open(tableOptions: any, layer: any) {
        if (this.currentTableLayer === layer) {
            this.close();
        } else {
            // close previous table properly if open
            if (this.currentTableLayer) {
                this.close();
            }
            this.tableOptions = tableOptions;

            // set filter change flag to true
            this.tableOptions.onFilterChanged = (event) => {
                this.filtersChanged = true;
            }

            this.panelStatusManager = new PanelStatusManager(this);
            this.panelStatusManager.setFilterAndScrollWatch();

            // set legend block / layer that the panel corresponds to
            this.currentTableLayer = layer;
            this.setLegendBlock(this.currentTableLayer._mapInstance.legendBlocks.entries);
            this.panelRowsManager = new PanelRowsManager(this);
            // set header / controls for panel
            let controls = this.header;
            controls = [
                `<h3 class="md-title table-title">Features: ${this.configManager.title}</h3>`,
                '<span style="flex: 1;"></span>',
                ...controls
            ];
            this.panel.setControls(controls);

            // set css for panel
            this.panel.panelBody.css('padding-top', '16px');
            this.panel.panelControls.css('display', 'flex');
            this.panel.panelControls.css('align-items', 'center');
            this.tableContent.empty();

            //create details and zoom buttons, open the panel and display proper filter values
            new DetailsAndZoomButtons(this);
            new Grid(this.tableContent[0], tableOptions);
            this.configManager.setDefaultGlobalSearchFilter();
            this.panel.open();
            this.panelStatusManager.getScrollRange();
            this.panelRowsManager.initObservers();

            this.tableOptions.onGridReady = () => {
                this.autoSizeToMaxWidth();
                this.sizeColumnsToFitIfNeeded();
                let colApi = this.tableOptions.columnApi
                let col = colApi.getDisplayedColAfter(colApi.getColumn('rvInteractive'));
                if (col !== (undefined || null) && col.sort === undefined) {
                    // set sort of first column to ascending by default if sort isn't specified
                    col.setSort("asc");
                }
            };

            // Set up grid panel accessibility
            // Link clicked legend element to the opened table
            const sourceEl = $(document).find(`[legend-block-id="${this.legendBlock.id}"] button`).filter(':visible').first();
            (<EnhancedJQuery><unknown>$(sourceEl)).link($(document).find(`#enhancedTable`));
            // Go from last filter input to grid and reverse
            let headers = this.panel.element[0].getElementsByClassName('ag-header-cell');
            let filters = headers[headers.length - 1].getElementsByTagName('INPUT');
            this.lastFilter = filters[filters.length - 1]; // final filter before grid
            this.gridBody = this.panel.element[0].getElementsByClassName('ag-body')[0];
            this.gridBody.tabIndex = 0; // make grid container tabable
            this.gridBody.addEventListener('focus', (e: any) => tabToGrid(e, this.tableOptions, this.lastFilter), false);
        }

        this.panelStatusManager.getFilterStatus();

        this.tableOptions.columnDefs.forEach(column => {
            if (column.floatingFilterComponentParams.defaultValue !== undefined && this.notVisible[column.field] === true) {
                // we temporarily showed some hidden columns with default values (so that table would get filtered properly)
                // now toggle them to hidden to respect config specifications
                let matchingCol = this.columnMenuCtrl.columnVisibilities.find(col => col.id === column.field);
                this.columnMenuCtrl.toggleColumn(matchingCol);
            }
        });
    }

    close() {
        this.panel.close();
    }

    onBtnExport() {
        this.tableOptions.api.exportDataAsCsv();
    }

    onBtnPrint() {
        let win = window.open('../print-table.html', '_blank');
        win.document.write(this.createHTMLTable());
    }

    createHTMLTable() {
        // make a dictionary of column keys with header names
        let columns = {};
        this.tableOptions.columnApi.columnController.allDisplayedCenterVirtualColumns.map(col => {
            if (col.colDef.field !== 'rvSymbol' && col.colDef.field !== 'rvInteractive' && col.colDef.field !== 'zoom') {
                columns[col.colDef.field] = col.colDef.headerName;
            }
        });

        // get displayed rows
        const rows = this.tableOptions.api.rowModel.rowsToDisplay;

        // create a printable HTML table with only rows and columns that
        // are currently displayed.
        return PRINT_TABLE(this.configManager.title, columns, rows);

    }

    setSize() {
        if (this.maximized) {
            this.panel.element[0].classList.add('full');
        } else {
            this.panel.element[0].classList.remove('full');
        }
        this.panel.panelContents.css({
            margin: 0,
            padding: '0px 16px 16px 16px'
        });
    }

    isMobile(): boolean {
        return $('.rv-small').length > 0 || $('.rv-medium').length > 0;
    }

    /**
     * Auto size all columns but check the max width
     * Note: Need a custom function here since setting maxWidth prevents
     *       `sizeColumnsToFit()` from filling the entire panel width
    */
    autoSizeToMaxWidth(columns?: Array<any>) {
        const maxWidth = 400;
        columns = columns ? columns : this.tableOptions.columnApi.getAllColumns();
        this.tableOptions.columnApi.autoSizeColumns(columns);
        columns.forEach(c => {
            if (c.actualWidth > maxWidth) {
                this.tableOptions.columnApi.setColumnWidth(c, maxWidth);
            }
        });
    };

    /**
     * Check if columns don't take up entire grid width. If not size the columns to fit.
     */
    sizeColumnsToFitIfNeeded() {
        const columns = this.tableOptions.columnApi.getAllDisplayedColumns();
        const panel = this.tableOptions.api.gridPanel;
        const availableWidth = panel.getWidthForSizeColsToFit();
        const usedWidth = panel.columnController.getWidthOfColsInList(columns);
        if (usedWidth < availableWidth) {
            const symbolCol = columns.find(c => c.colId === 'zoom');
            if (columns.length === 3) {
                symbolCol.maxWidth = undefined;
            } else {
                symbolCol.maxWidth = 40;
            }
            this.tableOptions.api.sizeColumnsToFit();
        }
    }

    get id(): string {
        this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
        return this._id;
    }

    get header(): any[] {
        this.angularHeader();

        const menuBtn = new this.panel.container(MENU_TEMPLATE(this.configManager.printEnabled));

        const closeBtn = new this.panel.button('X');

        const searchBar = new this.panel.container(SEARCH_TEMPLATE);

        const clearFiltersBtn = new this.panel.container(CLEAR_FILTERS_TEMPLATE);

        const applyToMapBtn = new this.panel.container(APPLY_TO_MAP_TEMPLATE);

        const columnVisibilityMenuBtn = new this.panel.container(COLUMN_VISIBILITY_MENU_TEMPLATE);

        const mobileMenuBtn = new this.panel.container(MOBILE_MENU_BTN_TEMPLATE);

        if (this.configManager.globalSearchEnabled) {
            this.mobileMenuScope.searchEnabled = true;
            return [mobileMenuBtn, searchBar, columnVisibilityMenuBtn, clearFiltersBtn, applyToMapBtn, menuBtn, closeBtn]
        }
        else {
            this.mobileMenuScope.searchEnabled = false;
            return [mobileMenuBtn, columnVisibilityMenuBtn, clearFiltersBtn, applyToMapBtn, menuBtn, closeBtn];
        }
    }

    angularHeader() {
        const that = this;
        this.mapApi.agControllerRegister('SearchCtrl', function () {

            that.searchText = that.configManager.defaultGlobalSearch;
            this.searchText = that.searchText;
            this.updatedSearchText = function () {
                that.searchText = this.searchText;
                that.tableOptions.api.setQuickFilter(this.searchText);
                that.panelRowsManager.quickFilterText = this.searchText;
                that.tableOptions.api.selectAllFiltered();
                that.panelStatusManager.getFilterStatus();
                that.tableOptions.api.deselectAllFiltered();
            };
            this.clearSearch = function () {
                that.searchText = '';
                this.searchText = that.searchText;
                this.updatedSearchText();
                that.panelStatusManager.getFilterStatus();
            };
        });

        this.mapApi.agControllerRegister('MenuCtrl', function () {
            this.appID = that.mapApi.id;
            this.maximized = that.maximized ? 'true' : 'false';
            this.showFilter = !!that.tableOptions.floatingFilter;
            this.filterByExtent = that.panelStateManager.filterByExtent;

            // sets the table size, either split view or full height
            // saves the set size to PanelStateManager
            this.setSize = function (value) {
                that.panelStateManager.maximized = value === 'true' ? true : false;
                !that.maximized ? that.mapApi.mapI.externalPanel(undefined) : that.mapApi.mapI.externalPanel($('#enhancedTable'));
                that.maximized = value === 'true' ? true : false;
                that.setSize();
                that.panelStatusManager.getScrollRange();
            };

            // print button has been clicked
            this.print = function () {
                that.onBtnPrint();
            };

            // export button has been clicked
            this.export = function () {
                that.onBtnExport();
            };

            // Hide filters button has been clicked
            this.toggleFilters = function () {
                that.tableOptions.floatingFilter = this.showFilter;
                that.tableOptions.api.refreshHeader();
            };

            // Sync filterByExtent
            this.filterExtentToggled = function() {
                that.panelStateManager.filterByExtent = this.filterByExtent;

                // On toggle, filter by extent or remove the extent filter
                if (that.panelStateManager.filterByExtent) {
                    that.panelRowsManager.filterByExtent(that.mapApi.mapI.extent);
                } else {
                    that.panelRowsManager.fetchValidOids();
                }
            };
        });

        this.mapApi.agControllerRegister('ClearFiltersCtrl', function () {
            // clear all column filters
            this.clearFilters = function () {

                const columns = Object.keys(that.tableOptions.api.getFilterModel());
                let newFilterModel = {};

                // go through the columns in the current filter model
                // save columns that have static filters
                // because static filters remain intact even on clear all filters
                let preservedColumns = columns.map(column => {
                    const columnConfigManager = that.configManager.columnConfigs[column];
                    if (columnConfigManager.isFilterStatic) {
                        newFilterModel[column] = that.tableOptions.api.getFilterModel()[column];
                        return column;
                    }
                });

                newFilterModel = newFilterModel !== {} ? newFilterModel : null;

                that.tableOptions.api.setFilterModel(newFilterModel);
            };

            // determine if there are any active column filters
            // returns true if there are no active column filters, false otherwise
            // this determines if Clear Filters button is disabled (when true) or enabled (when false)
            this.noActiveColumnFilters = function () {
                const columns = Object.keys(that.tableOptions.api.getFilterModel());
                let noActiveFilters = true;

                columns.forEach(column => {
                    const columnConfigManager = new ColumnConfigManager(that.configManager, column);
                    if (!columnConfigManager.isFilterStatic) {
                        // if there is a non static column fiter, the clearFilters button is disabled
                        noActiveFilters = false;
                    }
                });

                // if column filters don't exist or are static, clearFilters button is disabled
                return noActiveFilters;
            }
        });

        this.mapApi.agControllerRegister('ApplyToMapCtrl', function () {
            // returns true if a filter has been changed since the last
            this.filtersChanged = function () {
                return that.filtersChanged;
            };

            // apply filters to map
            this.applyToMap = function () {
                const filter = that.legendBlock.proxyWrapper.filterState;
                filter.setSql(filter.coreFilterTypes.GRID, getFiltersQuery());
                that.filtersChanged = false;
            };

            // get filter SQL qeury string
            function getFiltersQuery() {
                const filterModel = that.tableOptions.api.getFilterModel();
                let colStrs = [];
                Object.keys(filterModel).forEach(col => {
                    colStrs.push(filterToSql(col, filterModel[col]));
                });
                if (that.searchText) {
                    const globalSearchVal = globalSearchToSql();
                    if (globalSearchVal) { // will be an empty string if there are no visible rows
                        colStrs.push(globalSearchVal);
                    }
                }
                return colStrs.join(' AND ');
            }

            // convert column fitler to SQL string
            function filterToSql(col: string, colFilter: any): string {
                const column = that.configManager.columnConfigs[col];
                switch (colFilter.filterType) {
                    case 'text':
                        if (column.isSelector) {
                            return `UPPER(${col}) IN (${colFilter.filter.toUpperCase()})`;
                        } else {
                            let val = colFilter.filter.replace(/'/g, /''/);
                            if (that.configManager.lazyFilterEnabled) {
                                const filterVal = `*${val}`;
                                val = filterVal.split(" ").join("*");
                            }
                            if (val !== '') {
                                return `UPPER(${col}) LIKE \'${val.replace(/\*/g, '%').toUpperCase()}%\'`;
                            }
                        }
                    case 'number':
                        switch (colFilter.type) {
                            case 'greaterThanOrEqual':
                                return `${col} >= ${colFilter.filter}`;

                            case 'lessThanOrEqual':
                                return `${col} <= ${colFilter.filter}`;

                            case 'inRange':
                                return `${col} >= ${colFilter.filter} AND ${col} <= ${colFilter.filterTo}`;
                            default:
                                break;
                        }
                    case 'date':
                        const dateFrom = new Date(colFilter.dateFrom);
                        const dateTo = new Date(colFilter.dateTo);
                        const from = dateFrom ? `${dateFrom.getMonth() + 1}/${dateFrom.getDate()}/${dateFrom.getFullYear()}` : undefined;
                        const to = dateTo ? `${dateTo.getMonth() + 1}/${dateTo.getDate()}/${dateTo.getFullYear()}` : undefined;
                        switch (colFilter.type) {
                            case 'greaterThanOrEqual':
                                return `${col} >= DATE '${from}'`;

                            case 'lessThanOrEqual':
                                return `${col} <= DATE '${from}'`; // ag-grid uses from for a single upper limit as well

                            case 'inRange':
                                return `${col} >= DATE '${from}' AND ${col} <= DATE '${to}'`;
                            default:
                                break;
                        }
                }
            }

            // convert global search to SQL string filter of columns excluding unfiltered columns
            function globalSearchToSql(): string {
                let val = that.searchText.replace(/'/g, "''");
                const filterVal = `%${val.replace(/\*/g, '%').split(" ").join("%").toUpperCase()}`;
                const re = new RegExp(`.*${val.split(" ").join(".*").toUpperCase()}`);
                const sortedRows = that.tableOptions.api.rowModel.rowsToDisplay;
                const columns = that.tableOptions.columnApi.getAllDisplayedColumns()
                    .filter(column => column.colDef.filter === 'agTextColumnFilter');
                columns.splice(0, 3);
                let filteredColumns = [];
                columns.forEach(column => {
                    for (let row of sortedRows) {
                        if (re.test(row.data[column.colId].toUpperCase())) {
                            filteredColumns.push(`UPPER(${column.colId}) LIKE \'${filterVal}%\'`);
                        }
                    }
                });
                return filteredColumns.join(' AND ');
            }
        });

        this.mapApi.agControllerRegister('ColumnVisibilityMenuCtrl', function () {
            that.columnMenuCtrl = this;
            this.columns = that.tableOptions.columnDefs;
            this.columnVisibilities = this.columns
                .filter(element => element.headerName)
                .map(element => {
                    return ({ id: element.field, title: element.headerName, visibility: !element.hide });
                });

            // toggle column visibility
            this.toggleColumn = function (col) {
                col.visibility = !col.visibility;

                that.tableOptions.columnApi.setColumnVisible(col.id, col.visibility);

                // on showing a column resize to autowidth then shrink columns that are too wide
                if (col.visibility) {
                    that.autoSizeToMaxWidth();
                }

                // fit columns widths to table if there's empty space
                that.sizeColumnsToFitIfNeeded();
            };
        });

        this.mapApi.agControllerRegister('MobileMenuCtrl', function () {
            that.mobileMenuScope.visible = false;
            that.mobileMenuScope.sizeDisabled = true;

            this.toggleMenu = function () {
                that.mobileMenuScope.visible = !that.mobileMenuScope.visible;
            };
        });
    }
}

export interface PanelManager {
    panel: any;
    mapApi: any;
    tableContent: JQuery<HTMLElement>;
    _id: string;
    currentTableLayer: any;
    maximized: boolean;
    tableOptions: any;
    legendBlock: any;
    panelRowsManager: PanelRowsManager;
    panelStatusManager: PanelStatusManager;
    lastFilter: HTMLElement;
    gridBody: HTMLElement;
    configManager: any;
    mobileMenuScope: MobileMenuScope;
    recordCountScope: RecordCountScope;
    panelStateManager: PanelStateManager;
    searchText: string;
    filterByExtent: boolean;
    filtersChanged: boolean;
    hiddenColumns: any;
    columnMenuCtrl: any;
    notVisible: any;
}

interface EnhancedJQuery extends JQuery {
    link: any;
}

interface MobileMenuScope {
    visible: boolean;
    searchEnabled: boolean;
    sizeDisabled: boolean;
}

interface RecordCountScope {
    scrollRecords: string;
    filterRecords: string;
}

PanelManager.prototype.maximized = false;
