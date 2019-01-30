"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ag_grid_community_1 = require("ag-grid-community");
var templates_1 = require("./templates");
var details_and_zoom_buttons_1 = require("./details-and-zoom-buttons");
require("ag-grid-community/dist/styles/ag-grid.css");
require("./main.scss");
var panel_rows_manager_1 = require("./panel-rows-manager");
var panel_status_manager_1 = require("./panel-status-manager");
var grid_accessibility_1 = require("./grid-accessibility");
var config_manager_1 = require("./config-manager");
/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
var PanelManager = /** @class */ (function () {
    function PanelManager(mapApi) {
        var _this = this;
        this.mapApi = mapApi;
        this.tableContent = $("<div rv-focus-exempt></div>");
        this.panel = this.mapApi.createPanel('enhancedTable');
        this.setSize();
        this.panel.panelBody.addClass('ag-theme-material');
        this.panel.setBody(this.tableContent);
        this.panel.element[0].setAttribute('type', 'table');
        this.panel.element[0].classList.add('default');
        this.panel.element[0].addEventListener('focus', function (e) { return grid_accessibility_1.scrollIntoView(e, _this.panel.element[0]); }, true);
        // Enhance panel's close function so panel close button destroys table properly
        var close = this.panel.close.bind(this.panel);
        this.panel.close = function () {
            _this.panel.element[0].removeEventListener('focus', function (e) { return grid_accessibility_1.scrollIntoView(e, _this.panel.element[0]); }, true);
            _this.gridBody.removeEventListener('focus', function (e) { return grid_accessibility_1.tabToGrid(e, _this.tableOptions, _this.lastFilter); }, false);
            _this.currentTableLayer = undefined;
            close();
        };
        // add mobile menu to the dom
        var mobileMenuTemplate = $(templates_1.MOBILE_MENU_TEMPLATE)[0];
        this.mobileMenuScope = this.mapApi.$compile(mobileMenuTemplate);
        this.panel.panelControls.after(mobileMenuTemplate);
        // Add the scroll record count if it hasn't been added yet
        var recordCountTemplate = $(templates_1.RECORD_COUNT_TEMPLATE);
        this.recordCountScope = this.mapApi.$compile(recordCountTemplate);
        this.panel.panelControls.after(recordCountTemplate);
    }
    // recursively find and set the legend block for the layer
    PanelManager.prototype.setLegendBlock = function (legendEntriesList) {
        var _this = this;
        legendEntriesList.forEach(function (entry) {
            if (entry.proxyWrapper !== undefined && _this.currentTableLayer._layerProxy === entry.proxyWrapper.proxy) {
                _this.legendBlock = entry;
            }
            else if (entry.children || entry.entries) {
                _this.setLegendBlock(entry.children || entry.entries);
            }
        });
    };
    PanelManager.prototype.open = function (tableOptions, layer) {
        var _this = this;
        if (this.currentTableLayer === layer) {
            this.close();
        }
        else {
            this.tableOptions = tableOptions;
            this.panelStatusManager = new panel_status_manager_1.PanelStatusManager(this);
            this.panelStatusManager.setFilterAndScrollWatch();
            // set legend block / layer that the panel corresponds to
            this.currentTableLayer = layer;
            this.setLegendBlock(this.currentTableLayer._mapInstance.legendBlocks.entries);
            this.panelRowsManager = new panel_rows_manager_1.PanelRowsManager(this);
            // set header / controls for panel
            var controls = this.header;
            controls = [
                "<h3 class=\"md-title table-title\">Features: " + this.configManager.title + "</h3>",
                '<span style="flex: 1;"></span>'
            ].concat(controls);
            this.panel.setControls(controls);
            // set css for panel
            this.panel.panelBody.css('padding-top', '16px');
            this.panel.panelControls.css('display', 'flex');
            this.panel.panelControls.css('align-items', 'center');
            this.tableContent.empty();
            //create details and zoom buttons, open the panel and display proper filter values
            new details_and_zoom_buttons_1.DetailsAndZoomButtons(this);
            new ag_grid_community_1.Grid(this.tableContent[0], tableOptions);
            this.configManager.setDefaultGlobalSearchFilter();
            this.panel.open();
            this.panelStatusManager.getScrollRange();
            this.panelRowsManager.initObservers();
            this.tableOptions.onGridReady = function () {
                _this.autoSizeToMaxWidth();
                _this.sizeColumnsToFitIfNeeded();
                var colApi = _this.tableOptions.columnApi;
                var col = colApi.getDisplayedColAfter(colApi.getColumn('rvInteractive'));
                if (col !== (undefined || null) && col.sort === undefined) {
                    // set sort of first column to ascending by default if sort isn't specified
                    col.setSort("asc");
                }
            };
            // Set up grid panel accessibility
            // Link clicked legend element to the opened table
            var sourceEl = $(document).find("[legend-block-id=\"" + this.legendBlock.id + "\"] button").filter(':visible').first();
            $(sourceEl).link($(document).find("#enhancedTable"));
            // Go from last filter input to grid and reverse
            var headers = this.panel.element[0].getElementsByClassName('ag-header-cell');
            var filters = headers[headers.length - 1].getElementsByTagName('INPUT');
            this.lastFilter = filters[filters.length - 1]; // final filter before grid
            this.gridBody = this.panel.element[0].getElementsByClassName('ag-body')[0];
            this.gridBody.tabIndex = 0; // make grid container tabable
            this.gridBody.addEventListener('focus', function (e) { return grid_accessibility_1.tabToGrid(e, _this.tableOptions, _this.lastFilter); }, false);
            this.configManager.initColumns();
        }
        this.panelStatusManager.getFilterStatus();
    };
    PanelManager.prototype.close = function () {
        this.panel.close();
    };
    PanelManager.prototype.onBtnExport = function () {
        this.tableOptions.api.exportDataAsCsv();
    };
    PanelManager.prototype.onBtnPrint = function () {
        var _this = this;
        this.panel.panelBody.css({
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: this.tableOptions.api.getPreferredWidth() + 2,
            'z-index': '5',
            height: 'auto'
        });
        this.tableOptions.api.setGridAutoHeight(true);
        this.panel.panelBody.prependTo('body');
        setTimeout(function () {
            window.print();
            _this.panel.panelBody.appendTo(_this.panel.panelContents);
            _this.panel.panelBody.css({
                position: '',
                top: '',
                left: '',
                width: '',
                'z-index': '',
                height: 'calc(100% - 38px)'
            });
            _this.setSize();
            _this.tableOptions.api.setGridAutoHeight(false);
        }, 650);
    };
    PanelManager.prototype.setSize = function () {
        if (this.maximized) {
            this.panel.element[0].classList.add('full');
        }
        else {
            this.panel.element[0].classList.remove('full');
        }
        this.panel.panelContents.css({
            margin: 0,
            padding: '0px 16px 16px 16px'
        });
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
    ;
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
    Object.defineProperty(PanelManager.prototype, "id", {
        get: function () {
            this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PanelManager.prototype, "header", {
        get: function () {
            this.angularHeader();
            var menuBtn = new this.panel.container(templates_1.MENU_TEMPLATE);
            var closeBtn = new this.panel.button('X');
            var searchBar = new this.panel.container(templates_1.SEARCH_TEMPLATE);
            var clearFiltersBtn = new this.panel.container(templates_1.CLEAR_FILTERS_TEMPLATE);
            var columnVisibilityMenuBtn = new this.panel.container(templates_1.COLUMN_VISIBILITY_MENU_TEMPLATE);
            var mobileMenuBtn = new this.panel.container(templates_1.MOBILE_MENU_BTN_TEMPLATE);
            if (this.configManager.globalSearchEnabled) {
                this.mobileMenuScope.searchEnabled = true;
                return [mobileMenuBtn, searchBar, columnVisibilityMenuBtn, clearFiltersBtn, menuBtn, closeBtn];
            }
            else {
                this.mobileMenuScope.searchEnabled = false;
                return [mobileMenuBtn, columnVisibilityMenuBtn, clearFiltersBtn, menuBtn, closeBtn];
            }
        },
        enumerable: true,
        configurable: true
    });
    PanelManager.prototype.angularHeader = function () {
        var that = this;
        this.mapApi.agControllerRegister('SearchCtrl', function () {
            that.searchText = that.configManager.defaultGlobalSearch;
            this.searchText = that.searchText;
            this.updatedSearchText = function () {
                that.tableOptions.api.setQuickFilter(that.searchText);
                that.panelRowsManager.quickFilterText = that.searchText;
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
                    var columnConfigManager = new config_manager_1.ColumnConfigManager(that.configManager, column);
                    if (columnConfigManager.isFilterStatic) {
                        newFilterModel[column] = that.tableOptions.api.getFilterModel()[column];
                        return column;
                    }
                });
                newFilterModel = newFilterModel !== {} ? newFilterModel : null;
                that.tableOptions.api.setFilterModel(newFilterModel);
            };
            // determine if any column filters are present
            this.anyFilters = function () {
                return that.tableOptions.api.isAdvancedFilterPresent();
            };
        });
        this.mapApi.agControllerRegister('ColumnVisibilityMenuCtrl', function () {
            this.columns = that.tableOptions.columnDefs;
            this.columnVisibilities = this.columns
                .filter(function (element) { return element.headerName; })
                .map(function (element) {
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
    };
    return PanelManager;
}());
exports.PanelManager = PanelManager;
PanelManager.prototype.maximized = false;
