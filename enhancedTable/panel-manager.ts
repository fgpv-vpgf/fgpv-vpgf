import { Grid } from 'ag-grid-community';
import {
    SEARCH_TEMPLATE,
    MENU_TEMPLATE,
    CLEAR_FILTERS_TEMPLATE,
    COLUMN_VISIBILITY_MENU_TEMPLATE,
    MOBILE_MENU_TEMPLATE,
    MOBILE_MENU_BTN_TEMPLATE,
    RECORD_COUNT_TEMPLATE,
    APPLY_TO_MAP_TEMPLATE,
    TABLE_UPDATE_TEMPLATE
} from './templates';
import { DetailsAndZoomButtons } from './details-and-zoom-buttons';
import { PanelRowsManager } from './panel-rows-manager';
import { PanelStatusManager } from './panel-status-manager';
import { removeAccessibilityListeners, initAccessibilityListeners } from './grid-accessibility';
import { ColumnConfigManager } from './config-manager';
import { PanelStateManager } from './panel-state-manager';
import { PRINT_TABLE } from './templates';
import { ColumnState } from 'ag-grid-community/dist/lib/columnController/columnController';

/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
export class PanelManager {
    constructor(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = this.mapApi.panels.create('enhancedTable');
        this.setListeners();
        this.prepListNavigation();
        this.panel.body = $(`<div rv-focus-exempt></div>`);
        this.panel.element.addClass('ag-theme-material mobile-fullscreen tablet-fullscreen');
        this.panel.element.css({
            top: '0px',
            left: '410px'
        });
        this.panel.allowUnderlay = false;

        const close = this.panel.header.closeButton;
        close.removeClass('primary');
        close.addClass('black md-ink-ripple');
        this.setSize();
        //destroy the table properly whenever the panel is closed
        this.panel.closing.subscribe(() => {
            this.cleanUp();
        });
    }

    set panelStateManager(newPanelStateManager: PanelStateManager) {
        // store the column state before replacing the state manager
        if (this._panelStateManager && this.tableOptions) {
            this._panelStateManager.columnState = this.tableOptions.columnApi.getColumnState();
        }
        this._panelStateManager = newPanelStateManager;
    }

    get panelStateManager() {
        return this._panelStateManager;
    }

    setLegendBlock(block) {
        this.legendBlock = block;
    }

    /**
     * Keeps the scrollbar locked on certain keyboard and mouse movements.
     * This is to prevent key events like tabbing moving the table's contents.
     */
    setListeners() {
        const enhancedTable = this.panel._element;
        const that = this;

        $(document).mousemove(() => {
            if ($('.ag-body-viewport')[0] !== undefined) {
                $('.ag-body-viewport')[0].style.overflowX = 'auto';
                $('.ag-body-viewport')[0].style.position = 'static';
            }
        })

        enhancedTable.on('keydown keyup', (event) => {
            event.preventDefault();
            const focusedList = $('.element-focused')[0];
            const inList = $(document.activeElement).hasClass('rv-focus-list') || $(document.activeElement).parents().hasClass('rv-focus-list');
            const focusedCell = that.tableOptions.api.getFocusedCell();

            if (focusedList !== undefined && $(focusedList).hasClass('ag-body-container')) {
                $('.ag-body-viewport')[0].style.overflowX = 'hidden';

                // if focused on grid body
                if (event.keyCode === 9 && focusedCell === null) {
                    // if first tab into grid body automatically focus on first cell
                    that.tableOptions.api.setFocusedCell(0, 'rvSymbol');
                } else if (focusedCell !== null && event.keyCode === 27) {
                    // on esc key, clear focused cell
                    that.tableOptions.api.clearFocusedCell();
                }
            } else {
                that.tableOptions.api.clearFocusedCell();
            }

            if ((event.keyCode !== 9 && event.keyCode !== 27) || ($('.element-focused')[0] === undefined && inList)) {
                // if you are not tabbing or you are tabbing within a list or you're not pressing the escape key
                // set body to be scrollable
                $('.ag-body-viewport')[0].style.position = 'static';
            } else {
                // if you are tabbing between lists, body should be absolute
                $('.ag-body-viewport')[0].style.position = 'absolute';
            }
        });
    }

    /**
     * Add the rv-focus-item and rv-focus-list classes when focus manager reaches the table.
     */
    prepListNavigation() {

        const panelBody = this.panel.body;

        this.panel.populateList.subscribe(() => {

            // add rv-focus-list class to both header rows
            panelBody.find('.ag-header-row').each((index, row) => {
                if (row.childElementCount > 0) {
                    $(row).addClass('rv-focus-list');
                }
            });

            // add rv-focus-list class to table body, make sure arrow navigation is disabled
            panelBody.find('.ag-body-container').addClass('rv-focus-list disabled-arrows');

            // add rv-focus-item class to header cells with content in it
            panelBody.find('.ag-header-cell').each((index, cell) => {
                if ($(cell).children(':not(span, .ag-cell-label-container, .ag-floating-filter-body)').length > 0) {
                    $(cell).addClass('rv-focus-item');
                    $(cell).attr('tabindex', -1);
                }
            });

            // add rv-focus-item class to each table cell
            panelBody.find('.ag-cell').each((index, cell) => {
                $(cell).addClass('rv-focus-item');
            });
        })
    }

    open(tableOptions: any, layer: any, tableBuilder: any) {
        if (this.currentTableLayer === layer) {
            this.panel.close();
        } else {
            // close previous table properly if open
            if (this.currentTableLayer) {
                this.panel.close();
            }
            this.tableOptions = tableOptions;

            // create tooltips on cell focus when appropriate
            this.tableOptions.onCellFocused = (cell) => {
                if (cell.rowIndex !== null) {
                    const focusedCell = <HTMLElement>$(`[row-index=${cell.rowIndex}]`).find(`[col-id=${cell.column.colId}]`)[0];
                    const focusedCellText = <HTMLElement>focusedCell.children[0];

                    if (focusedCellText.offsetWidth > focusedCell.offsetWidth) {

                        const positionTooltip = () => {
                            const tooltip = $('.rv-render-tooltip')[0];
                            const topMargin = $(focusedCell).offset().top - $(tooltip).offset().top;
                            const topLeft = $(focusedCell).offset().left - $(tooltip).offset().left;
                            const overlayBottom = $('.ag-overlay').position().top + $('.ag-overlay').height();

                            // position the tooltip so that it is associated with the focused cell
                            tooltip.style.top = `${topMargin + 240}px`;
                            tooltip.style.left = `${topLeft}px`;

                            if (tooltip.offsetTop + $(tooltip).height() > overlayBottom - 20) {
                                // position the tooltip so that it stays within the grid
                                tooltip.style.bottom = '20px';
                            }
                        }

                        // if the cell text is not  contained within newly focused cell, create an overlay tooltip which shows full text
                        this.tableOptions.overlayNoRowsTemplate = `<span class='rv-render-tooltip'>${focusedCellText.innerHTML}</span>`;
                        this.tableOptions.api.showNoRowsOverlay();
                        positionTooltip();
                    } else {
                        // if a text is contained within newly focused cell, hide any overlay tooltips
                        this.tableOptions.api.hideOverlay();
                    }
                }
            }

            // set filter change flag to true
            // also hide cell tooltips because focus is lost on cells when filters are changed
            this.tableOptions.onFilterChanged = event => {
                this.sizeColumnsToFitIfNeeded();
                this.filtersChanged = true;
                this.tableOptions.api.hideOverlay();
            };

            // cell tooltips should disappear when column visibilities change
            // since cell focus is lost when column visibilities change
            this.tableOptions.onColumnVisible = event => {
                this.tableOptions.api.hideOverlay();
            };

            // cell tooltips should disappear when columns move
            // since cell focus is lost when columns move (focus on header cell that caused movement)
            this.tableOptions.onColumnMoved = event => {
                this.tableOptions.api.hideOverlay();
            };

            this.panelStatusManager = new PanelStatusManager(this);
            this.panelStatusManager.setFilterAndScrollWatch();

            // set legend block / layer that the panel corresponds to
            this.currentTableLayer = layer;
            this.panelRowsManager = new PanelRowsManager(this);

            // get mobile menu template and scope
            let mobileMenuTemplate = $(MOBILE_MENU_TEMPLATE)[0];
            this.mobileMenuScope = this.mapApi.$compile(mobileMenuTemplate);

            // set header / controls for panel
            this.makeHeader();
            this.panel.header.title = `{{ 'filter.title' | translate }} ${this.configManager.title}`;
            this.panel.header.elements.title[0].title = this.panel.header.elements.title[0].innerHTML;

            // Add the scroll record count
            let recordCountTemplate = $(RECORD_COUNT_TEMPLATE);
            this.recordCountScope = this.mapApi.$compile(recordCountTemplate);
            this.panel.element.find('.rv-record-count').remove(); // remove old count if there
            this.panel.element.find('header').append(recordCountTemplate[0]);

            // create details and zoom buttons, open the panel and display proper filter values
            new DetailsAndZoomButtons(this);
            this.panel.body.empty();
            new Grid(this.panel.body[0], tableOptions);
            this.configManager.setDefaultGlobalSearchFilter();
            // if theres stored column state give it to the table
            if (this.panelStateManager.columnState) {
                this.tableOptions.columnApi.setColumnState(this.panelStateManager.columnState);
            }
            const sortModel = this.panelStateManager.sortModel;
            if (sortModel !== undefined) {
                this.tableOptions.api.setSortModel(sortModel);
            }

            this.panelStatusManager.getScrollRange();
            this.panelRowsManager.initObservers();

            // add mobile menu to grid body above grid
            this.panel.body.prepend(mobileMenuTemplate);

            this.tableOptions.onGridReady = () => {
                // sync column state to visibility list
                this.updateColumnVisibility();
                this.autoSizeToMaxWidth();
                this.sizeColumnsToFitIfNeeded();
                let colApi = this.tableOptions.columnApi;
                let col = colApi.getDisplayedColAfter(colApi.getColumn('zoom'));
                if (col !== (undefined || null) && col.sort === undefined) {
                    // set sort of first column to ascending by default if sort isn't specified
                    col.setSort('asc');
                }

                // Set up grid panel accessibility
                // Link clicked legend element to the opened table
                const sourceEl = $(document)
                    .find(`[legend-block-id="${this.legendBlock.id}"] button`)
                    .filter(':visible')
                    .first();
                (<EnhancedJQuery>(<unknown>$(sourceEl))).link($(document).find(`#enhancedTable`));

                // Set up grid <-> filter accessibility
                this.gridBody = this.panel.element[0].getElementsByClassName('ag-body')[0];
                this.gridBody.tabIndex = 0; // make grid container tabable
                initAccessibilityListeners(this.panel.element[0], this.gridBody, this.tableOptions);

                this.panelStatusManager.getFilterStatus();

                // on table reopen with show filters off, reset floatingFilter and set to false to proc onFloatingFilterChanged in custom-floating-filters
                if (!this.panelStateManager.showFilter && this.panelStateManager.showFilter !== this.tableOptions.floatingFilter) {
                    this.tableOptions.floatingFilter = this.panelStateManager.showFilter;
                    this.tableOptions.api.refreshHeader();
                }

                // stop loading panel from opening, if we are about to open enhancedTable
                clearTimeout(tableBuilder.loadingTimeout);
                if (tableBuilder.loadingPanel.isOpen) {
                    // if loading panel was opened, make sure it stays on for at least 400 ms
                    setTimeout(() => {
                        tableBuilder.deleteLoaderPanel();
                    }, 400);
                } else {
                    tableBuilder.deleteLoaderPanel();
                }

                this.tableOptions.columnDefs.forEach(column => {
                    const matchingCol = this.columnMenuCtrl.columnVisibilities.find(col => col.id === column.field);
                    if (matchingCol !== undefined && matchingCol.visibility === false) {
                        // temporarily show column filter of hidden columns (so that table gets filtered properly)
                        this.columnMenuCtrl.toggleColumn(matchingCol);
                        // then hide column (to respect config specifications)
                        this.columnMenuCtrl.toggleColumn(matchingCol);
                    }
                });

                this.panel.open();
                this.autoSizeToMaxWidth();
                this.sizeColumnsToFitIfNeeded();
            };
        }
    }

    /**
     * Cleans up the table when the panel is being closed.
     */
    cleanUp() {
        this.panelStateManager.sortModel = this.tableOptions.api.getSortModel();

        if (this.gridBody !== undefined) {
            removeAccessibilityListeners(this.panel.element[0], this.gridBody);
        }
        this.panelStateManager.isOpen = false;
        this.panelRowsManager.destroyObservers();
        if (this.toastInterval !== undefined) {
            clearInterval(this.toastInterval);
        }
        this.currentTableLayer = undefined;

        // if enhancedTable closes, set focus to close button
        const mapNavContent = $('#' + this.mapApi.id).find('.rv-mapnav-content');
        mapNavContent.find('button')[0].focus();
    }

    onBtnExport() {
        const dataColumns = this.tableOptions.columnApi.getAllDisplayedVirtualColumns().slice(3);
        this.tableOptions.api.exportDataAsCsv({ columnKeys: dataColumns });
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
            this.panel.element.css({ bottom: '0' });
        } else {
            this.panel.element.css({ bottom: '50%' });
        }
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
    }

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

    /**
     * Updates the column visibility list used for the columnVisibility control
     */
    updateColumnVisibility(): void {
        const columnStates: ColumnState[] = this.tableOptions.columnApi.getColumnState();
        this.columnMenuCtrl.columnVisibilities.forEach(column => {
            column.visibility = !columnStates.find(columnState => {
                return column.id === columnState.colId;
            }).hide;
        });
    }

    get id(): string {
        this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
        return this._id;
    }

    makeHeader() {
        this.angularHeader();

        const header = this.panel.header;

        // remove old controls
        header.controls.find('.table-control').remove();
        header.controls
            .find('.mobile-table-control')
            .not('.mobile-table-menu')
            .remove();
        // add table controls
        header.prepend(this.compileTemplate(MOBILE_MENU_BTN_TEMPLATE));
        header.prepend(this.compileTemplate(MENU_TEMPLATE));
        header.prepend(this.compileTemplate(COLUMN_VISIBILITY_MENU_TEMPLATE));
        header.prepend(this.compileTemplate(APPLY_TO_MAP_TEMPLATE));
        header.prepend(this.compileTemplate(CLEAR_FILTERS_TEMPLATE));
        if (this.configManager.globalSearchEnabled) {
            this.mobileMenuScope.searchEnabled = true;
            header.prepend(this.compileTemplate(SEARCH_TEMPLATE));
        }

        this.mapApi.$compile($(`<div ng-controller="ToastCtrl as ctrl"></div>`));
    }

    /**
     * Forces tooltips to hide.
     * Apply to map and clear filter tooltips are shown on click and mouseleave on IE/edge.
     */
    hideToolTips() {
        Array.from(document.getElementsByTagName('md-tooltip')).forEach(tooltip => {
            tooltip.classList.remove('md-show');
        });
    }

    angularHeader() {
        const that = this;
        this.mapApi.agControllerRegister('ToastCtrl', ['$scope', '$mdToast', '$rootElement', function ($scope, $mdToast, $rootElement) {
            that.showToast = function () {
                if ($rootElement.find('.table-toast').length === 0) {
                    $mdToast.show({
                        template: TABLE_UPDATE_TEMPLATE,
                        parent: that.panel.element[0],
                        position: 'bottom rv-flex-global',
                        hideDelay: false,
                        controller: 'ToastCtrl'
                    });
                }
            };

            $scope.reloadTable = () => {
                that.reload(that.currentTableLayer);
                $mdToast.hide();
            };

            $scope.closeToast = () => $mdToast.hide();
        }]);

        this.mapApi.agControllerRegister('SearchCtrl', function () {
            that.searchText = that.configManager.defaultGlobalSearch;
            this.searchText = that.searchText ? that.searchText : '';
            this.updatedSearchText = function () {
                that.searchText = this.searchText;
                // don't filter unless there are at least 3 characters
                if (this.searchText.length > 2) {
                    that.tableOptions.api.setQuickFilter(this.searchText);
                    that.panelRowsManager.quickFilterText = this.searchText;
                } else {
                    that.tableOptions.api.setQuickFilter('');
                    that.panelRowsManager.quickFilterText = '';
                }
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

            that.clearGlobalSearch = this.clearSearch.bind(this);
        });

        this.mapApi.agControllerRegister('MenuCtrl', function () {
            this.appID = that.mapApi.id;
            this.maximized = that.maximized ? 'true' : 'false';
            this.showFilter = that.panelStateManager.colFilter;
            this.filterByExtent = that.panelStateManager.filterByExtent;
            this.printEnabled = that.configManager.printEnabled;

            // sets the table size, either split view or full height
            // saves the set size to PanelStateManager
            this.setSize = function (value) {
                that.panelStateManager.maximized = value === 'true' ? true : false;
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
                that.panelStateManager.colFilter = this.showFilter;

                that.tableOptions.floatingFilter = this.showFilter;
                that.tableOptions.api.refreshHeader();
            };

            // Sync filterByExtent
            this.filterExtentToggled = function () {
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
                that.hideToolTips();
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
                if (that.clearGlobalSearch !== undefined) {
                    that.clearGlobalSearch();
                }
                that.tableOptions.api.setFilterModel(newFilterModel);
                that.filtersChanged = true;
            };

            // determine if there are any active column filters
            // returns true if there are no active column filters, false otherwise
            // this determines if Clear Filters button is disabled (when true) or enabled (when false)
            this.noActiveFilters = function () {
                if (that.tableOptions.api !== undefined) {
                    const columns = Object.keys(that.tableOptions.api.getFilterModel());
                    // if there is a non static column fiter, the clearFilters button is enabled
                    let noFilters = !columns.some(col => {
                        const columnConfigManager = new ColumnConfigManager(that.configManager, col);
                        return !columnConfigManager.isFilterStatic;
                    });
                    // if column filters don't exist or are static, clearFilters button is disabled
                    return noFilters && !that.searchText;
                } else {
                    return true;
                }
            };
        });

        this.mapApi.agControllerRegister('ApplyToMapCtrl', function () {

            this.filtersChanged = function () {
                if (that.filtersChanged) {
                    const filtersQuery = getFiltersQuery();
                    const fState = that.legendBlock.proxyWrapper.filterState
                    const mapFilter = fState.getSql(fState.coreFilterTypes.GRID);
                    // if filter is changed
                    // check if filter changed is the same as one applied to map
                    // if not, apply to map will be enabled
                    // else it will be disabled
                    return filtersQuery !== mapFilter;
                }
                return false;
            };

            // apply filters to map
            this.applyToMap = function () {
                const filter = that.legendBlock.proxyWrapper.filterState;
                const mapFilterQuery = getFiltersQuery();
                filter.setSql(filter.coreFilterTypes.GRID, mapFilterQuery);
                that.filtersChanged = false;
                that.hideToolTips();
            };

            // get filter SQL query string
            function getFiltersQuery() {
                const filterModel = that.tableOptions.api.getFilterModel();
                let colStrs = [];
                Object.keys(filterModel).forEach(col => {
                    colStrs.push(filterToSql(col, filterModel[col]));
                });
                if (that.searchText && that.searchText.length > 2) {
                    const globalSearchVal = globalSearchToSql() !== '' ? globalSearchToSql() : '1=2';
                    if (globalSearchVal) {
                        // do not push an empty global search
                        colStrs.push(`(${globalSearchVal})`);
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
                            if (val !== '') {
                                // following code is to UNESCAPE all special chars for ESRI and geoApi SQL to parse properly (remove the backslash)
                                const escRegex = /\\[(!"#$&\'+,.\\\/:;<=>?@[\]^`{|}~)]/g;
                                // remVal stores the remaining string text after the last special char (or the entire string, if there are no special chars at all)
                                let remVal = val;
                                let newVal = '';
                                let escMatch = escRegex.exec(val);
                                // lastIdx stores the last found index of the start of an escaped special char
                                let lastIdx = 0;
                                while (escMatch) {
                                    // update all variables after finding an escaped special char, preserving all text except the backslash
                                    newVal = newVal + val.substr(lastIdx, escMatch.index - lastIdx) + escMatch[0].slice(-1);
                                    lastIdx = escMatch.index + 2;
                                    remVal = val.substr(escMatch.index + 2);
                                    escMatch = escRegex.exec(val);
                                }
                                newVal = newVal + remVal;

                                // add ௌ before % and/or _ to act as the escape character
                                // can change to MOST other characters and should still work (ideally want an escape char no one will search for) - just replace all instances of ௌ
                                newVal = newVal.replace(/%/g, 'ௌ%');
                                newVal = newVal.replace(/_/g, 'ௌ_');
                                if (that.configManager.lazyFilterEnabled) {
                                    const filterVal = `*${newVal}`;
                                    newVal = filterVal.split(' ').join('*');
                                }
                                // if val contains a % or _, add ESCAPE 'ௌ' at the end of the query
                                let sqlWhere = `UPPER(${col}) LIKE \'${newVal.replace(/\*/g, '%').toUpperCase()}%\'`;
                                return sqlWhere.includes('ௌ%') || sqlWhere.includes('ௌ_') ? `${sqlWhere} ESCAPE \'ௌ\'` : sqlWhere;
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
                const filterVal = `%${val
                    .replace(/\*/g, '%')
                    .split(' ')
                    .join('%')
                    .toUpperCase()}`;
                const re = new RegExp(
                    `.*${val
                        .split(' ')
                        .join('.*')
                        .toUpperCase()}`
                );
                const sortedRows = that.tableOptions.api.rowModel.rowsToDisplay;
                const columns = that.tableOptions.columnApi
                    .getAllDisplayedColumns()
                    .filter(column => column.colDef.filter === 'agTextColumnFilter');
                columns.splice(0, 3);
                let filteredColumns = [];
                columns.forEach(column => {
                    for (let row of sortedRows) {
                        const cellData = row.data[column.colId] === null ? null : row.data[column.colId].toString();
                        if (cellData !== null && re.test(cellData.toUpperCase())) {
                            filteredColumns.push(`UPPER(${column.colId}) LIKE \'${filterVal}%\'`);
                            return;
                        }
                    }
                });
                return filteredColumns.join(' OR ');
            }
        });

        this.mapApi.agControllerRegister('ColumnVisibilityMenuCtrl', function () {
            that.columnMenuCtrl = this;
            this.columns = that.tableOptions.columnDefs;
            this.columnVisibilities = this.columns
                .filter(element => element.headerName)
                .map(element => {
                    return { id: element.field, title: element.headerName, visibility: !element.hide };
                })
                .sort((firstEl, secondEl) => firstEl['title'].localeCompare(secondEl['title']));

            // toggle column visibility
            this.toggleColumn = function (col) {
                const column = that.tableOptions.columnApi.getColumn(col.id);

                col.visibility = !column.visible;

                that.tableOptions.columnApi.setColumnVisible(col.id, !column.visible);

                // on showing a column resize to autowidth then shrink columns that are too wide
                if (col.visibility) {
                    that.autoSizeToMaxWidth();
                    that.panelStateManager.columnState = that.tableOptions.columnApi.getColumnState();
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

    compileTemplate(template): JQuery<HTMLElement> {
        let temp = $(template);
        this.mapApi.$compile(temp);
        return temp;
    }
}

export interface PanelManager {
    panel: any;
    mapApi: any;
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
    _panelStateManager: PanelStateManager;
    searchText: string;
    filterByExtent: boolean;
    filtersChanged: boolean;
    hiddenColumns: any;
    columnMenuCtrl: any;
    clearGlobalSearch: Function;
    reload: Function;
    toastInterval: any;
    showToast: Function;
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
