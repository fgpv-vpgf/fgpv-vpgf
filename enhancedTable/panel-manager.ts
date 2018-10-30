import { Grid } from 'ag-grid-community';
import { SEARCH_TEMPLATE, MENU_TEMPLATE, CLEAR_FILTERS_TEMPLATE, COLUMN_VISIBILITY_MENU_TEMPLATE } from './templates';
import 'ag-grid-community/dist/styles/ag-grid.css';
import './main.scss';

/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
export class PanelManager {

    constructor(mapApi: any) {
        this.mapApi = mapApi;
        this.tableContent = $(`<div rv-focus-exempt></div>`);
        this.panel = this.mapApi.createPanel('enhancedTable');

        this.setSize();
        this.panel.panelBody.addClass('ag-theme-material');
        this.panel.content = new this.panel.container(this.tableContent);
    }

    // gets the updated text to display for the enhancedTable's filter status
    getFilterStatus() {
        let text: string;

        if (this.tableOptions.api && this.tableOptions.api.getSelectedNodes().length > 0 && this.tableOptions.api.getSelectedNodes().length < this.tableOptions.rowData.length) {
            text = `${this.tableOptions.api.getSelectedNodes().length} records shown (filtered from ${this.tableOptions.rowData.length} records)`;
        }
        else {
            text = `${this.tableOptions.rowData.length} records shown`;
        }

        if (this.panel.panelControls.find('.filterRecords')[0]) {
            this.panel.panelControls.find('.filterRecords')[0].innerHTML = text;
        }
        this.getScrollRange();
        return text;
    }

    // gets the updated row range to get as table is scrolled vertically (example "showing 1-10 of 50 entries")
    getScrollRange() {
        let rowRange: string;
        if (this.tableOptions.api) {
            const topPixel = this.tableOptions.api.getVerticalPixelRange().top;
            const bottomPixel = this.tableOptions.api.getVerticalPixelRange().bottom;
            let firstRow;
            let lastRow;
            this.tableOptions.api.getRenderedNodes().forEach(row => {
                //if the top row is greater than the top pixel plus a little (to account rows that are just a little cut off) then broadcast its index in the status
                if (firstRow === undefined && row.rowTop > topPixel - (row.rowHeight / 2)) {
                    firstRow = parseInt(row.rowIndex) + 1;
                }
                //if the bottom row is less than the bottom pixel plus a little (to account rows that are just a little cut off) then broadcast its index in the status
                if ((row.rowTop + row.rowHeight) < bottomPixel + (row.rowHeight / 2)) {
                    lastRow = parseInt(row.rowIndex) + 1;
                }
            });

            rowRange = firstRow.toString() + "-" + lastRow.toString();
        }
        else {
            rowRange = this.maximized ? '1-15' : '1-5';
        }
        if (this.panel.panelControls.find('.scrollRecords')[0]) {
            this.panel.panelControls.find('.scrollRecords')[0].innerHTML = rowRange;
        }

        return rowRange;
    }

    open(tableOptions: any, layer: any) {
        if (this.currentTableLayer === layer) {
            this.close();
        } else {
            this.tableOptions = tableOptions;

            let panelManager = this;

            // when filter is changed, get the correct filter status
            this.tableOptions.onFilterChanged = function (event) {
                if (panelManager.tableOptions.api) {
                    panelManager.tableOptions.api.selectAllFiltered();
                    panelManager.getFilterStatus();
                    panelManager.tableOptions.api.deselectAllFiltered();
                }
            }

            this.tableOptions.onBodyScroll = function (event) {
                panelManager.getScrollRange();
            }

            let controls = this.header;
            controls = [new this.panel.container('<span style="flex: 1;"></span>'), ...controls];
            controls = [new this.panel.container(`<div style="padding-bottom :30px"><h2><b>Features: ${layer.name}</b></h2><br><p><span class="scrollRecords">${this.getScrollRange()}</span> of <span class="filterRecords">${this.getFilterStatus()}</span></div>`), ...controls];
            this.panel.controls = controls;
            this.panel.panelBody.css('padding-top', '16px');
            this.panel.panelControls.css('display', 'flex');
            this.panel.panelControls.css('align-items', 'center');
            this.currentTableLayer = layer;
            this.tableContent.empty();
            new Grid(this.tableContent[0], tableOptions);
            this.panel.open();
            this.getScrollRange();
        }
    }

    close() {
        this.panel.close();
        this.currentTableLayer = undefined;
    }

    onBtnExport() {
        this.tableOptions.api.exportDataAsCsv();
    }

    onBtnPrint() {
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

        setTimeout(() => {
            window.print();
            this.panel.panelBody.appendTo(this.panel.panelContents);
            this.panel.panelBody.css({
                position: '',
                top: '',
                left: '',
                width: '',
                'z-index': '',
                height: 'calc(100% - 38px)'
            });
            this.setSize();
            this.tableOptions.api.setGridAutoHeight(false);
        }, 650);
    }

    setSize() {
        this.panel.panelContents.css({
            top: '0px',
            left: '410px',
            right: '0px',
            bottom: this.maximized ? '0px' : '50%',
            padding: '0px 16px 16px 16px'
        });
    }

    get id(): string {
        this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
        return this._id;
    }

    get header(): any[] {
        this.angularHeader();

        const menuBtn = new this.panel.container(MENU_TEMPLATE);

        const closeBtn = new this.panel.button('X');

        const searchBar = new this.panel.container(SEARCH_TEMPLATE);

        const clearFiltersBtn = new this.panel.container(CLEAR_FILTERS_TEMPLATE);

        const columnVisibilityMenuBtn = new this.panel.container(COLUMN_VISIBILITY_MENU_TEMPLATE);

        return [searchBar, columnVisibilityMenuBtn, clearFiltersBtn, menuBtn, closeBtn];
    }

    angularHeader() {
        const that = this;
        this.mapApi.agControllerRegister('SearchCtrl', function () {
            this.searchText = '';
            this.updatedSearchText = function () {
                that.tableOptions.api.setQuickFilter(this.searchText);
            };
            this.clearSearch = function () {
                this.searchText = '';
                this.updatedSearchText();
                that.getFilterStatus();
            };
        });

        this.mapApi.agControllerRegister('MenuCtrl', function () {
            this.appID = that.mapApi.id;
            this.maximized = that.maximized ? 'true' : 'false';
            this.showFilter = !!that.tableOptions.floatingFilter;

            // sets the table size, either split view or full height
            this.setSize = function (value) {
                that.maximized = value === 'true' ? true : false;
                that.setSize();
                that.getScrollRange();
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
                that.tableOptions.api.setFilterModel(null);
            };

            // determine if any column filters are present
            this.anyFilters = function () {
                return that.tableOptions.api.isAdvancedFilterPresent();
            };
        });

        this.mapApi.agControllerRegister('ColumnVisibilityMenuCtrl', function () {
            this.columns = that.tableOptions.columnDefs;
            this.columnVisibilities = this.columns
                .filter(element => element.headerName)
                .map(element => ({ id: element.field, title: element.headerName, visibility: true }));

            that.tableOptions.onGridReady = () => {
                const columns = that.tableOptions.columnApi.getAllDisplayedColumns();
                this.autoSizeToMaxWidth(columns);
            };

            // toggle column visibility
            this.toggleColumn = function (col) {
                col.visibility = !col.visibility;
                that.tableOptions.columnApi.setColumnVisible(col.id, col.visibility);

                // on showing a column resize to autowidth then shrink columns that are too wide
                const columns = that.tableOptions.columnApi.getAllDisplayedColumns();
                if (col.visibility) {
                    this.autoSizeToMaxWidth(columns);
                }

                // fit columns widths to table if there's empty space
                const panel = that.tableOptions.api.gridPanel;
                const availableWidth = panel.getWidthForSizeColsToFit();
                const usedWidth = panel.columnController.getWidthOfColsInList(columns);
                if (usedWidth < availableWidth) {
                    that.tableOptions.api.sizeColumnsToFit();
                }
            };

            /**
             * Auto size all columns but check the max width
             * Note: Need a custom function here since setting maxWidth prevents
             *       `sizeColumnsToFit()` from filling the entire panel width
            */
            this.autoSizeToMaxWidth = function (columns) {
                const maxWidth = 400;

                that.tableOptions.columnApi.autoSizeColumns(columns);
                columns.forEach(c => {
                    if (c.actualWidth > maxWidth) {
                        that.tableOptions.columnApi.setColumnWidth(c, maxWidth);
                    }
                });
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
}

PanelManager.prototype.maximized = false;
