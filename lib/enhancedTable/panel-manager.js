"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ag_grid_community_1 = require("ag-grid-community");
var templates_1 = require("./templates");
var details_and_zoom_buttons_1 = require("./details-and-zoom-buttons");
var panel_rows_manager_1 = require("./panel-rows-manager");
var panel_status_manager_1 = require("./panel-status-manager");
var grid_accessibility_1 = require("./grid-accessibility");
var config_manager_1 = require("./config-manager");
var templates_2 = require("./templates");
/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
var PanelManager = /** @class */ (function () {
    function PanelManager(mapApi) {
        var _this = this;
        this.notVisible = {};
        this.mapApi = mapApi;
        this.panel = this.mapApi.panels.create('enhancedTable');
        this.panel.body = $("<div rv-focus-exempt></div>");
        this.panel.element.addClass('ag-theme-material mobile-fullscreen');
        this.panel.element.css({
            top: '0px',
            left: '410px'
        });
        this.panel.allowUnderlay = false;
        var close = this.panel.header.closeButton;
        close.removeClass('primary');
        close.addClass('black md-ink-ripple');
        this.setSize();
        //destroy the table properly whenever the panel is closed
        this.panel.closing.subscribe(function (response) {
            if (_this.gridBody !== undefined) {
                grid_accessibility_1.removeAccessibilityListeners(_this.panel.element[0], _this.gridBody);
            }
            _this.panelStateManager.isOpen = false;
            _this.panelRowsManager.destroyObservers();
            if (_this.toastInterval !== undefined) {
                clearInterval(_this.toastInterval);
            }
            _this.currentTableLayer = undefined;
            _this.mapApi.mapI.externalPanel(undefined);
        });
    }
    Object.defineProperty(PanelManager.prototype, "panelStateManager", {
        get: function () {
            return this._panelStateManager;
        },
        set: function (newPanelStateManager) {
            // store the column state before replacing the state manager
            if (this._panelStateManager && this.tableOptions) {
                this._panelStateManager.columnState = this.tableOptions.columnApi.getColumnState();
            }
            this._panelStateManager = newPanelStateManager;
        },
        enumerable: true,
        configurable: true
    });
    PanelManager.prototype.setLegendBlock = function (block) {
        this.legendBlock = block;
    };
    PanelManager.prototype.open = function (tableOptions, layer, tableBuilder) {
        var _this = this;
        if (this.currentTableLayer === layer) {
            this.close();
        }
        else {
            // close previous table properly if open
            if (this.currentTableLayer) {
                this.close();
            }
            this.tableOptions = tableOptions;
            // set filter change flag to true
            this.tableOptions.onFilterChanged = function (event) {
                _this.sizeColumnsToFitIfNeeded();
                _this.filtersChanged = true;
            };
            this.panelStatusManager = new panel_status_manager_1.PanelStatusManager(this);
            this.panelStatusManager.setFilterAndScrollWatch();
            // set legend block / layer that the panel corresponds to
            this.currentTableLayer = layer;
            this.panelRowsManager = new panel_rows_manager_1.PanelRowsManager(this);
            // get mobile menu template and scope
            var mobileMenuTemplate = $(templates_1.MOBILE_MENU_TEMPLATE)[0];
            this.mobileMenuScope = this.mapApi.$compile(mobileMenuTemplate);
            // set header / controls for panel
            this.makeHeader();
            this.panel.header.title = "{{ 'filter.title' | translate }} " + this.configManager.title;
            // Add the scroll record count
            var recordCountTemplate = $(templates_1.RECORD_COUNT_TEMPLATE);
            this.recordCountScope = this.mapApi.$compile(recordCountTemplate);
            this.panel.element.find('.rv-record-count').remove(); // remove old count if there
            this.panel.element.find('header').append(recordCountTemplate[0]);
            //create details and zoom buttons, open the panel and display proper filter values
            new details_and_zoom_buttons_1.DetailsAndZoomButtons(this);
            this.panel.body.empty();
            new ag_grid_community_1.Grid(this.panel.body[0], tableOptions);
            this.configManager.setDefaultGlobalSearchFilter();
            // if theres stored column state give it to the table
            if (this.panelStateManager.columnState) {
                this.tableOptions.columnApi.setColumnState(this.panelStateManager.columnState);
            }
            this.panelStatusManager.getScrollRange();
            this.panelRowsManager.initObservers();
            // add mobile menu to grid body above grid
            this.panel.body.prepend(mobileMenuTemplate);
            this.tableOptions.onGridReady = function () {
                // sync column state to visibility list
                _this.updateColumnVisibility();
                _this.autoSizeToMaxWidth();
                _this.sizeColumnsToFitIfNeeded();
                var colApi = _this.tableOptions.columnApi;
                var col = colApi.getDisplayedColAfter(colApi.getColumn('zoom'));
                if (col !== (undefined || null) && col.sort === undefined) {
                    // set sort of first column to ascending by default if sort isn't specified
                    col.setSort('asc');
                }
                // Set up grid panel accessibility
                // Link clicked legend element to the opened table
                var sourceEl = $(document)
                    .find("[legend-block-id=\"" + _this.legendBlock.id + "\"] button")
                    .filter(':visible')
                    .first();
                $(sourceEl).link($(document).find("#enhancedTable"));
                // Set up grid <-> filter accessibility
                _this.gridBody = _this.panel.element[0].getElementsByClassName('ag-body')[0];
                _this.gridBody.tabIndex = 0; // make grid container tabable
                grid_accessibility_1.initAccessibilityListeners(_this.panel.element[0], _this.gridBody, _this.tableOptions);
                _this.panelStatusManager.getFilterStatus();
                _this.tableOptions.columnDefs.forEach(function (column) {
                    if (column.floatingFilterComponentParams.defaultValue !== undefined && _this.notVisible[column.field] === true) {
                        // we temporarily showed some hidden columns with default values (so that table would get filtered properly)
                        // now toggle them to hidden to respect config specifications
                        var matchingCol = _this.columnMenuCtrl.columnVisibilities.find(function (col) { return col.id === column.field; });
                        _this.columnMenuCtrl.toggleColumn(matchingCol);
                    }
                });
                // stop loading panel from opening, if we are about to open enhancedTable
                clearTimeout(tableBuilder.loadingTimeout);
                if (tableBuilder.loadingPanel.isOpen) {
                    //if loading panel was opened, make sure it stays on for at least 400 ms
                    setTimeout(function () {
                        tableBuilder.deleteLoaderPanel();
                    }, 400);
                }
                else {
                    tableBuilder.deleteLoaderPanel();
                }
                _this.panel.open();
                _this.autoSizeToMaxWidth();
                _this.sizeColumnsToFitIfNeeded();
            };
        }
    };
    PanelManager.prototype.close = function () {
        this.panelStateManager.isOpen = false;
        this.panel.close();
    };
    PanelManager.prototype.onBtnExport = function () {
        var dataColumns = this.tableOptions.columnApi.getAllDisplayedVirtualColumns().slice(3);
        this.tableOptions.api.exportDataAsCsv({ columnKeys: dataColumns });
    };
    PanelManager.prototype.onBtnPrint = function () {
        var win = window.open('../print-table.html', '_blank');
        win.document.write(this.createHTMLTable());
    };
    PanelManager.prototype.createHTMLTable = function () {
        // make a dictionary of column keys with header names
        var columns = {};
        this.tableOptions.columnApi.columnController.allDisplayedCenterVirtualColumns.map(function (col) {
            if (col.colDef.field !== 'rvSymbol' && col.colDef.field !== 'rvInteractive' && col.colDef.field !== 'zoom') {
                columns[col.colDef.field] = col.colDef.headerName;
            }
        });
        // get displayed rows
        var rows = this.tableOptions.api.rowModel.rowsToDisplay;
        // create a printable HTML table with only rows and columns that
        // are currently displayed.
        return templates_2.PRINT_TABLE(this.configManager.title, columns, rows);
    };
    PanelManager.prototype.setSize = function () {
        if (this.maximized) {
            this.panel.element.css({ bottom: '0' });
            this.mapApi.mapI.externalPanel($('#enhancedTable'));
        }
        else {
            this.panel.element.css({ bottom: '50%' });
            this.mapApi.mapI.externalPanel(undefined);
        }
    };
    PanelManager.prototype.isMobile = function () {
        return $('.rv-small').length > 0 || $('.rv-medium').length > 0;
    };
    /**
     * Auto size all columns but check the max width
     * Note: Need a custom function here since setting maxWidth prevents
     *       `sizeColumnsToFit()` from filling the entire panel width
     */
    PanelManager.prototype.autoSizeToMaxWidth = function (columns) {
        var _this = this;
        var maxWidth = 400;
        columns = columns ? columns : this.tableOptions.columnApi.getAllColumns();
        this.tableOptions.columnApi.autoSizeColumns(columns);
        columns.forEach(function (c) {
            if (c.actualWidth > maxWidth) {
                _this.tableOptions.columnApi.setColumnWidth(c, maxWidth);
            }
        });
    };
    /**
     * Check if columns don't take up entire grid width. If not size the columns to fit.
     */
    PanelManager.prototype.sizeColumnsToFitIfNeeded = function () {
        var columns = this.tableOptions.columnApi.getAllDisplayedColumns();
        var panel = this.tableOptions.api.gridPanel;
        var availableWidth = panel.getWidthForSizeColsToFit();
        var usedWidth = panel.columnController.getWidthOfColsInList(columns);
        if (usedWidth < availableWidth) {
            var symbolCol = columns.find(function (c) { return c.colId === 'zoom'; });
            if (columns.length === 3) {
                symbolCol.maxWidth = undefined;
            }
            else {
                symbolCol.maxWidth = 40;
            }
            this.tableOptions.api.sizeColumnsToFit();
        }
    };
    /**
     * Updates the column visibility list used for the columnVisibility control
     */
    PanelManager.prototype.updateColumnVisibility = function () {
        var columnStates = this.tableOptions.columnApi.getColumnState();
        this.columnMenuCtrl.columnVisibilities.forEach(function (column) {
            column.visibility = !columnStates.find(function (columnState) {
                return column.id === columnState.colId;
            }).hide;
        });
    };
    Object.defineProperty(PanelManager.prototype, "id", {
        get: function () {
            this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    PanelManager.prototype.makeHeader = function () {
        this.angularHeader();
        var header = this.panel.header;
        // remove old controls
        header.controls.find('.table-control').remove();
        header.controls
            .find('.mobile-table-control')
            .not('.mobile-table-menu')
            .remove();
        // add table controls
        header.prepend(this.compileTemplate(templates_1.MOBILE_MENU_BTN_TEMPLATE));
        header.prepend(this.compileTemplate(templates_1.MENU_TEMPLATE));
        header.prepend(this.compileTemplate(templates_1.COLUMN_VISIBILITY_MENU_TEMPLATE));
        header.prepend(this.compileTemplate(templates_1.APPLY_TO_MAP_TEMPLATE));
        header.prepend(this.compileTemplate(templates_1.CLEAR_FILTERS_TEMPLATE));
        if (this.configManager.globalSearchEnabled) {
            this.mobileMenuScope.searchEnabled = true;
            header.prepend(this.compileTemplate(templates_1.SEARCH_TEMPLATE));
        }
        this.mapApi.$compile($("<div ng-controller=\"ToastCtrl as ctrl\"></div>"));
    };
    PanelManager.prototype.angularHeader = function () {
        var that = this;
        this.mapApi.agControllerRegister('ToastCtrl', ['$scope', '$mdToast', '$rootElement', function ($scope, $mdToast, $rootElement) {
                that.showToast = function () {
                    if ($rootElement.find('.table-toast').length === 0) {
                        $mdToast.show({
                            template: templates_1.TABLE_UPDATE_TEMPLATE,
                            parent: that.panel.element[0],
                            position: 'bottom rv-flex-global',
                            hideDelay: false,
                            controller: 'ToastCtrl'
                        });
                    }
                };
                $scope.reloadTable = function () {
                    that.reload(that.currentTableLayer);
                    $mdToast.hide();
                };
                $scope.closeToast = function () { return $mdToast.hide(); };
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
                }
                else {
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
            this.showFilter = !!that.tableOptions.floatingFilter;
            this.filterByExtent = that.panelStateManager.filterByExtent;
            this.printEnabled = that.configManager.printEnabled;
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
            this.filterExtentToggled = function () {
                that.panelStateManager.filterByExtent = this.filterByExtent;
                // On toggle, filter by extent or remove the extent filter
                if (that.panelStateManager.filterByExtent) {
                    that.panelRowsManager.filterByExtent(that.mapApi.mapI.extent);
                }
                else {
                    that.panelRowsManager.fetchValidOids();
                }
            };
        });
        this.mapApi.agControllerRegister('ClearFiltersCtrl', function () {
            // clear all column filters
            this.clearFilters = function () {
                var columns = Object.keys(that.tableOptions.api.getFilterModel());
                var newFilterModel = {};
                // go through the columns in the current filter model
                // save columns that have static filters
                // because static filters remain intact even on clear all filters
                var preservedColumns = columns.map(function (column) {
                    var columnConfigManager = that.configManager.columnConfigs[column];
                    if (columnConfigManager.isFilterStatic) {
                        newFilterModel[column] = that.tableOptions.api.getFilterModel()[column];
                        return column;
                    }
                });
                newFilterModel = newFilterModel !== {} ? newFilterModel : null;
                that.clearGlobalSearch();
                that.tableOptions.api.setFilterModel(newFilterModel);
            };
            // determine if there are any active column filters
            // returns true if there are no active column filters, false otherwise
            // this determines if Clear Filters button is disabled (when true) or enabled (when false)
            this.noActiveFilters = function () {
                if (that.tableOptions.api !== undefined) {
                    var columns = Object.keys(that.tableOptions.api.getFilterModel());
                    // if there is a non static column fiter, the clearFilters button is enabled
                    var noFilters = !columns.some(function (col) {
                        var columnConfigManager = new config_manager_1.ColumnConfigManager(that.configManager, col);
                        return !columnConfigManager.isFilterStatic;
                    });
                    // if column filters don't exist or are static, clearFilters button is disabled
                    return noFilters && !that.searchText;
                }
                else {
                    return true;
                }
            };
        });
        this.mapApi.agControllerRegister('ApplyToMapCtrl', function () {
            // returns true if a filter has been changed since the last
            this.filtersChanged = function () {
                return that.filtersChanged;
            };
            // apply filters to map
            this.applyToMap = function () {
                var filter = that.legendBlock.proxyWrapper.filterState;
                filter.setSql(filter.coreFilterTypes.GRID, getFiltersQuery());
                that.filtersChanged = false;
            };
            // get filter SQL qeury string
            function getFiltersQuery() {
                var filterModel = that.tableOptions.api.getFilterModel();
                var colStrs = [];
                Object.keys(filterModel).forEach(function (col) {
                    colStrs.push(filterToSql(col, filterModel[col]));
                });
                if (that.searchText) {
                    var globalSearchVal = globalSearchToSql();
                    if (globalSearchVal) {
                        // will be an empty string if there are no visible rows
                        colStrs.push(globalSearchVal);
                    }
                }
                return colStrs.join(' AND ');
            }
            // convert column fitler to SQL string
            function filterToSql(col, colFilter) {
                var column = that.configManager.columnConfigs[col];
                switch (colFilter.filterType) {
                    case 'text':
                        if (column.isSelector) {
                            return "UPPER(" + col + ") IN (" + colFilter.filter.toUpperCase() + ")";
                        }
                        else {
                            var val = colFilter.filter.replace(/'/g, /''/);
                            if (val !== '') {
                                if (that.configManager.lazyFilterEnabled) {
                                    var filterVal = "*" + val;
                                    val = filterVal.split(' ').join('*');
                                }
                                return "UPPER(" + col + ") LIKE '" + val.replace(/\*/g, '%').toUpperCase() + "%'";
                            }
                        }
                    case 'number':
                        switch (colFilter.type) {
                            case 'greaterThanOrEqual':
                                return col + " >= " + colFilter.filter;
                            case 'lessThanOrEqual':
                                return col + " <= " + colFilter.filter;
                            case 'inRange':
                                return col + " >= " + colFilter.filter + " AND " + col + " <= " + colFilter.filterTo;
                            default:
                                break;
                        }
                    case 'date':
                        var dateFrom = new Date(colFilter.dateFrom);
                        var dateTo = new Date(colFilter.dateTo);
                        var from = dateFrom ? dateFrom.getMonth() + 1 + "/" + dateFrom.getDate() + "/" + dateFrom.getFullYear() : undefined;
                        var to = dateTo ? dateTo.getMonth() + 1 + "/" + dateTo.getDate() + "/" + dateTo.getFullYear() : undefined;
                        switch (colFilter.type) {
                            case 'greaterThanOrEqual':
                                return col + " >= DATE '" + from + "'";
                            case 'lessThanOrEqual':
                                return col + " <= DATE '" + from + "'"; // ag-grid uses from for a single upper limit as well
                            case 'inRange':
                                return col + " >= DATE '" + from + "' AND " + col + " <= DATE '" + to + "'";
                            default:
                                break;
                        }
                }
            }
            // convert global search to SQL string filter of columns excluding unfiltered columns
            function globalSearchToSql() {
                var val = that.searchText.replace(/'/g, "''");
                var filterVal = "%" + val
                    .replace(/\*/g, '%')
                    .split(' ')
                    .join('%')
                    .toUpperCase();
                var re = new RegExp(".*" + val
                    .split(' ')
                    .join('.*')
                    .toUpperCase());
                var sortedRows = that.tableOptions.api.rowModel.rowsToDisplay;
                var columns = that.tableOptions.columnApi
                    .getAllDisplayedColumns()
                    .filter(function (column) { return column.colDef.filter === 'agTextColumnFilter'; });
                columns.splice(0, 3);
                var filteredColumns = [];
                columns.forEach(function (column) {
                    for (var _i = 0, sortedRows_1 = sortedRows; _i < sortedRows_1.length; _i++) {
                        var row = sortedRows_1[_i];
                        if (re.test(row.data[column.colId].toUpperCase())) {
                            filteredColumns.push("UPPER(" + column.colId + ") LIKE '" + filterVal + "%'");
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
                .filter(function (element) { return element.headerName; })
                .map(function (element) {
                return { id: element.field, title: element.headerName, visibility: !element.hide };
            })
                .sort(function (firstEl, secondEl) { return firstEl['title'].localeCompare(secondEl['title']); });
            // toggle column visibility
            this.toggleColumn = function (col) {
                var column = that.tableOptions.columnApi.getColumn(col.id);
                col.visibility = !column.visible;
                that.tableOptions.columnApi.setColumnVisible(col.id, !column.visible);
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
    };
    PanelManager.prototype.compileTemplate = function (template) {
        var temp = $(template);
        this.mapApi.$compile(temp);
        return temp;
    };
    return PanelManager;
}());
exports.PanelManager = PanelManager;
PanelManager.prototype.maximized = false;
