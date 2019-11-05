"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Manages the status to be displayed at any given time for an enhancedTable. One PanelStatusManager is created for one PanelManager.
 *
 * Status is updated based on layer visibility, symbol visibilty, text filters, scrolling, and table min/maxing.
 */
var PanelStatusManager = /** @class */ (function () {
    function PanelStatusManager(panelManager) {
        this.panelManager = panelManager;
        this.tableOptions = panelManager.tableOptions;
    }
    // sets watches for when table filters are changed, or the table is scrolled
    // updates the panel status accordingly
    PanelStatusManager.prototype.setFilterAndScrollWatch = function () {
        var tableOptions = this.tableOptions;
        var that = this;
        var oldFilterChanged = tableOptions.onFilterChanged.bind(tableOptions);
        tableOptions.onFilterChanged = function (event) {
            if (tableOptions && tableOptions.api) {
                tableOptions.api.selectAllFiltered();
                that.getFilterStatus();
                tableOptions.api.deselectAllFiltered();
            }
            oldFilterChanged(event);
        };
        tableOptions.onBodyScroll = function (event) {
            var scrollRange = that.getScrollRange();
            var focusedCell = that.tableOptions.api.getFocusedCell();
            if (focusedCell !== null) {
                var topRow = parseInt(scrollRange.split(' - ')[0]) - 1;
                var bottomRow = parseInt(scrollRange.split(' - ')[1]) - 1;
                var tableRight = $('#enhancedTable').position().left + $('#enhancedTable').width();
                var focusedCellRight = $('.ag-cell-focus').offset().left + $('.ag-cell-focus').width();
                var focusedRow = focusedCell.rowIndex;
                if (topRow < focusedRow && bottomRow > focusedRow && tableRight > focusedCellRight) {
                    // refocus cell on scroll if it is within grid view
                    // this way adjusting the position and height of any associated tooltips is forced through onCellFocused event
                    that.tableOptions.api.setFocusedCell(focusedCell.rowIndex, focusedCell.column.colId);
                }
                else {
                    // hide any tooltips that may be visible if the focused cell is out of grid view
                    that.tableOptions.api.hideOverlay();
                }
            }
        };
    };
    // gets the updated text to display for the enhancedTable's filter status
    PanelStatusManager.prototype.getFilterStatus = function () {
        this.panelManager.recordCountScope.shownRecords = this.tableOptions.api.getDisplayedRowCount();
        this.panelManager.recordCountScope.totalRecords = this.tableOptions.rowData.length;
        // rows are filtered
        if (this.tableOptions.api && this.tableOptions.api.getDisplayedRowCount() < this.tableOptions.rowData.length) {
            this.panelManager.recordCountScope.filtered = true;
            this.panelManager.legendBlock.filter = true; // add filter flag if rows are filtered
        }
        else {
            this.panelManager.recordCountScope.filtered = false;
            this.panelManager.legendBlock.filter = false; // clear filter flag if all rows shown
        }
        this.getScrollRange();
    };
    // gets the updated row range to get as table is scrolled vertically (example "showing 1-10 of 50 entries")
    PanelStatusManager.prototype.getScrollRange = function () {
        var rowRange;
        if (this.tableOptions.api) {
            var topPixel_1 = this.tableOptions.api.getVerticalPixelRange().top;
            var bottomPixel_1 = this.tableOptions.api.getVerticalPixelRange().bottom;
            var firstRow_1;
            var lastRow_1;
            this.tableOptions.api.getRenderedNodes().forEach(function (row) {
                //if the top row is greater than the top pixel plus a little (to account rows that are just a little cut off) then broadcast its index in the status
                if (firstRow_1 === undefined && row.rowTop > topPixel_1 - (row.rowHeight / 2)) {
                    firstRow_1 = parseInt(row.rowIndex) + 1;
                }
                //if the bottom row is less than the bottom pixel plus a little (to account rows that are just a little cut off) then broadcast its index in the status
                if ((row.rowTop + row.rowHeight) < bottomPixel_1 + (row.rowHeight / 2)) {
                    lastRow_1 = parseInt(row.rowIndex) + 1;
                }
            });
            if ((firstRow_1 === undefined && lastRow_1 === undefined) || topPixel_1 === bottomPixel_1) {
                firstRow_1 = 0;
                lastRow_1 = 0;
            }
            rowRange = firstRow_1.toString() + " - " + lastRow_1.toString();
        }
        else {
            rowRange = this.panelManager.maximized ? '1 - 15' : '1 - 5';
        }
        // if (this.panelManager.panel.panelControls.find('.scrollRecords')[0]) {
        //     this.panelManager.panel.panelControls.find('.scrollRecords')[0].innerHTML = rowRange;
        // }
        this.panelManager.recordCountScope.scrollRecords = rowRange;
        return rowRange;
    };
    return PanelStatusManager;
}());
exports.PanelStatusManager = PanelStatusManager;
