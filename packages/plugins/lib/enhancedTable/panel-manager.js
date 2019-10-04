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
        this.mapApi = mapApi;
        this.panel = this.mapApi.panels.create('enhancedTable');
        this.setListeners();
        this.prepListNavigation();
        this.panel.body = $("<div rv-focus-exempt></div>");
        this.panel.element.addClass('ag-theme-material mobile-fullscreen tablet-fullscreen');
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
        this.panel.closing.subscribe(function () {
            _this.cleanUp();
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
    /**
     * Keeps the scrollbar locked on certain keyboard and mouse movements.
     * This is to prevent key events like tabbing moving the table's contents.
     */
    PanelManager.prototype.setListeners = function () {
        var enhancedTable = this.panel._element;
        var that = this;
        $(document).mousemove(function () {
            if ($('.ag-body-viewport')[0] !== undefined) {
                $('.ag-body-viewport')[0].style.overflowX = 'auto';
                $('.ag-body-viewport')[0].style.position = 'static';
            }
        });
        enhancedTable.on('keydown keyup', function (event) {
            event.preventDefault();
            var focusedList = $('.element-focused')[0];
            var inList = $(document.activeElement).hasClass('rv-focus-list') || $(document.activeElement).parents().hasClass('rv-focus-list');
            var focusedCell = that.tableOptions.api.getFocusedCell();
            if (focusedList !== undefined && $(focusedList).hasClass('ag-body-container')) {
                $('.ag-body-viewport')[0].style.overflowX = 'hidden';
                // if focused on grid body
                if (event.keyCode === 9 && focusedCell === null) {
                    // if first tab into grid body automatically focus on first cell
                    that.tableOptions.api.setFocusedCell(0, 'rvSymbol');
                }
                else if (focusedCell !== null && event.keyCode === 27) {
                    // on esc key, clear focused cell
                    that.tableOptions.api.clearFocusedCell();
                }
            }
            else {
                that.tableOptions.api.clearFocusedCell();
            }
            if ((event.keyCode !== 9 && event.keyCode !== 27) || ($('.element-focused')[0] === undefined && inList)) {
                // if you are not tabbing or you are tabbing within a list or you're not pressing the escape key
                // set body to be scrollable
                $('.ag-body-viewport')[0].style.position = 'static';
            }
            else {
                // if you are tabbing between lists, body should be absolute
                $('.ag-body-viewport')[0].style.position = 'absolute';
            }
        });
    };
    /**
     * Add the rv-focus-item and rv-focus-list classes when focus manager reaches the table.
     */
    PanelManager.prototype.prepListNavigation = function () {
        var panelBody = this.panel.body;
        this.panel.populateList.subscribe(function () {
            // add rv-focus-list class to both header rows
            panelBody.find('.ag-header-row').each(function (index, row) {
                if (row.childElementCount > 0) {
                    $(row).addClass('rv-focus-list');
                }
            });
            // add rv-focus-list class to table body, make sure arrow navigation is disabled
            panelBody.find('.ag-body-container').addClass('rv-focus-list disabled-arrows');
            // add rv-focus-item class to header cells with content in it
            panelBody.find('.ag-header-cell').each(function (index, cell) {
                if ($(cell).children(':not(span, .ag-cell-label-container, .ag-floating-filter-body)').length > 0) {
                    $(cell).addClass('rv-focus-item');
                    $(cell).attr('tabindex', -1);
                }
            });
            // add rv-focus-item class to each table cell
            panelBody.find('.ag-cell').each(function (index, cell) {
                $(cell).addClass('rv-focus-item');
            });
        });
    };
    PanelManager.prototype.open = function (tableOptions, layer, tableBuilder) {
        var _this = this;
        if (this.currentTableLayer === layer) {
            this.panel.close();
        }
        else {
            // close previous table properly if open
            if (this.currentTableLayer) {
                this.panel.close();
            }
            this.tableOptions = tableOptions;
            // create tooltips on cell focus when appropriate
            this.tableOptions.onCellFocused = function (cell) {
                if (cell.rowIndex !== null) {
                    var focusedCell_1 = $("[row-index=" + cell.rowIndex + "]").find("[col-id=" + cell.column.colId + "]")[0];
                    var focusedCellText = focusedCell_1.children[0];
                    if (focusedCellText.offsetWidth > focusedCell_1.offsetWidth) {
                        var positionTooltip = function () {
                            var tooltip = $('.rv-render-tooltip')[0];
                            var topMargin = $(focusedCell_1).offset().top - $(tooltip).offset().top;
                            var topLeft = $(focusedCell_1).offset().left - $(tooltip).offset().left;
                            var overlayBottom = $('.ag-overlay').position().top + $('.ag-overlay').height();
                            // position the tooltip so that it is associated with the focused cell
                            tooltip.style.top = topMargin + 240 + "px";
                            tooltip.style.left = topLeft + "px";
                            if (tooltip.offsetTop + $(tooltip).height() > overlayBottom - 20) {
                                // position the tooltip so that it stays within the grid
                                tooltip.style.bottom = '20px';
                            }
                        };
                        // if the cell text is not  contained within newly focused cell, create an overlay tooltip which shows full text
                        _this.tableOptions.overlayNoRowsTemplate = "<span class='rv-render-tooltip'>" + focusedCellText.innerHTML + "</span>";
                        _this.tableOptions.api.showNoRowsOverlay();
                        positionTooltip();
                    }
                    else {
                        // if a text is contained within newly focused cell, hide any overlay tooltips
                        _this.tableOptions.api.hideOverlay();
                    }
                }
            };
            // set filter change flag to true
            // also hide cell tooltips because focus is lost on cells when filters are changed
            this.tableOptions.onFilterChanged = function (event) {
                _this.sizeColumnsToFitIfNeeded();
                _this.filtersChanged = true;
                _this.tableOptions.api.hideOverlay();
            };
            // cell tooltips should disappear when column visibilities change
            // since cell focus is lost when column visibilities change
            this.tableOptions.onColumnVisible = function (event) {
                _this.tableOptions.api.hideOverlay();
            };
            // cell tooltips should disappear when columns move
            // since cell focus is lost when columns move (focus on header cell that caused movement)
            this.tableOptions.onColumnMoved = function (event) {
                _this.tableOptions.api.hideOverlay();
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
            this.panel.header.elements.title[0].title = this.panel.header.elements.title[0].innerHTML;
            // Add the scroll record count
            var recordCountTemplate = $(templates_1.RECORD_COUNT_TEMPLATE);
            this.recordCountScope = this.mapApi.$compile(recordCountTemplate);
            this.panel.element.find('.rv-record-count').remove(); // remove old count if there
            this.panel.element.find('header').append(recordCountTemplate[0]);
            // create details and zoom buttons, open the panel and display proper filter values
            new details_and_zoom_buttons_1.DetailsAndZoomButtons(this);
            this.panel.body.empty();
            new ag_grid_community_1.Grid(this.panel.body[0], tableOptions);
            this.configManager.setDefaultGlobalSearchFilter();
            // if theres stored column state give it to the table
            if (this.panelStateManager.columnState) {
                this.tableOptions.columnApi.setColumnState(this.panelStateManager.columnState);
            }
            var sortModel = this.panelStateManager.sortModel;
            if (sortModel !== undefined) {
                this.tableOptions.api.setSortModel(sortModel);
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
                // on table reopen with show filters off, reset floatingFilter and set to false to proc onFloatingFilterChanged in custom-floating-filters
                if (!_this.panelStateManager.showFilter && _this.panelStateManager.showFilter !== _this.tableOptions.floatingFilter) {
                    _this.tableOptions.floatingFilter = _this.panelStateManager.showFilter;
                    _this.tableOptions.api.refreshHeader();
                }
                // stop loading panel from opening, if we are about to open enhancedTable
                clearTimeout(tableBuilder.loadingTimeout);
                if (tableBuilder.loadingPanel.isOpen) {
                    // if loading panel was opened, make sure it stays on for at least 400 ms
                    setTimeout(function () {
                        tableBuilder.deleteLoaderPanel();
                    }, 400);
                }
                else {
                    tableBuilder.deleteLoaderPanel();
                }
                _this.tableOptions.columnDefs.forEach(function (column) {
                    var matchingCol = _this.columnMenuCtrl.columnVisibilities.find(function (col) { return col.id === column.field; });
                    if (matchingCol !== undefined && matchingCol.visibility === false) {
                        // temporarily show column filter of hidden columns (so that table gets filtered properly)
                        _this.columnMenuCtrl.toggleColumn(matchingCol);
                        // then hide column (to respect config specifications)
                        _this.columnMenuCtrl.toggleColumn(matchingCol);
                    }
                });
                _this.panel.open();
                _this.autoSizeToMaxWidth();
                _this.sizeColumnsToFitIfNeeded();
            };
        }
    };
    /**
     * Cleans up the table when the panel is being closed.
     */
    PanelManager.prototype.cleanUp = function () {
        this.panelStateManager.sortModel = this.tableOptions.api.getSortModel();
        if (this.gridBody !== undefined) {
            grid_accessibility_1.removeAccessibilityListeners(this.panel.element[0], this.gridBody);
        }
        this.panelStateManager.isOpen = false;
        this.panelRowsManager.destroyObservers();
        if (this.toastInterval !== undefined) {
            clearInterval(this.toastInterval);
        }
        this.currentTableLayer = undefined;
        // if enhancedTable closes, set focus to close button
        var mapNavContent = $('#' + this.mapApi.id).find('.rv-mapnav-content');
        mapNavContent.find('button')[0].focus();
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
        }
        else {
            this.panel.element.css({ bottom: '50%' });
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
    /**
     * Forces tooltips to hide.
     * Apply to map and clear filter tooltips are shown on click and mouseleave on IE/edge.
     */
    PanelManager.prototype.hideToolTips = function () {
        Array.from(document.getElementsByTagName('md-tooltip')).forEach(function (tooltip) {
            tooltip.classList.remove('md-show');
        });
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
                }
                else {
                    that.panelRowsManager.fetchValidOids();
                }
            };
        });
        this.mapApi.agControllerRegister('ClearFiltersCtrl', function () {
            // clear all column filters
            this.clearFilters = function () {
                that.hideToolTips();
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
            this.filtersChanged = function () {
                if (that.filtersChanged) {
                    var filtersQuery = getFiltersQuery();
                    var fState = that.legendBlock.proxyWrapper.filterState;
                    var mapFilter = fState.getSql(fState.coreFilterTypes.GRID);
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
                var filter = that.legendBlock.proxyWrapper.filterState;
                var mapFilterQuery = getFiltersQuery();
                filter.setSql(filter.coreFilterTypes.GRID, mapFilterQuery);
                that.filtersChanged = false;
                that.hideToolTips();
            };
            // get filter SQL query string
            function getFiltersQuery() {
                var filterModel = that.tableOptions.api.getFilterModel();
                var colStrs = [];
                Object.keys(filterModel).forEach(function (col) {
                    colStrs.push(filterToSql(col, filterModel[col]));
                });
                if (that.searchText && that.searchText.length > 2) {
                    var globalSearchVal = globalSearchToSql() !== '' ? globalSearchToSql() : '1=2';
                    if (globalSearchVal) {
                        // do not push an empty global search
                        colStrs.push("(" + globalSearchVal + ")");
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
                                // following code is to UNESCAPE all special chars for ESRI and geoApi SQL to parse properly (remove the backslash)
                                var escRegex = /\\[(!"#$&\'+,.\\\/:;<=>?@[\]^`{|}~)]/g;
                                // remVal stores the remaining string text after the last special char (or the entire string, if there are no special chars at all)
                                var remVal = val;
                                var newVal = '';
                                var escMatch = escRegex.exec(val);
                                // lastIdx stores the last found index of the start of an escaped special char
                                var lastIdx = 0;
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
                                    var filterVal = "*" + newVal;
                                    newVal = filterVal.split(' ').join('*');
                                }
                                // if val contains a % or _, add ESCAPE 'ௌ' at the end of the query
                                var sqlWhere = "UPPER(" + col + ") LIKE '" + newVal.replace(/\*/g, '%').toUpperCase() + "%'";
                                return sqlWhere.includes('ௌ%') || sqlWhere.includes('ௌ_') ? sqlWhere + " ESCAPE '\u0BCC'" : sqlWhere;
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
                        var cellData = row.data[column.colId] === null ? null : row.data[column.colId].toString();
                        if (cellData !== null && re.test(cellData.toUpperCase())) {
                            filteredColumns.push("UPPER(" + column.colId + ") LIKE '" + filterVal + "%'");
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
