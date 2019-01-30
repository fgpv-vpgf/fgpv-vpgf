"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Function to ensure focused column filter is scrolled into view
 * @param element filter being focused
 * @param panel table panel with scrollbar
 */
function scrollIntoView(element, panel) {
    element = element.target;
    var container = panel.getElementsByClassName('ag-body-viewport')[0];
    var _a = getOffset(element, container), elementRect = _a.elementRect, containerRect = _a.containerRect, offset = _a.offset;
    var offsetDelta = 0;
    if (offset.left < 0) {
        offsetDelta = offset.left;
    }
    else if (offset.left + elementRect.width > containerRect.width) {
        offsetDelta = offset.left + elementRect.width - containerRect.width;
    }
    if (offsetDelta !== 0) {
        container.scrollLeft += offsetDelta;
    }
    function getOffset(element, container) {
        var elementRect = element.getBoundingClientRect();
        var containerRect = container.getBoundingClientRect();
        return {
            elementRect: elementRect,
            containerRect: containerRect,
            offset: {
                top: elementRect.top - containerRect.top,
                left: elementRect.left - containerRect.left
            }
        };
    }
}
exports.scrollIntoView = scrollIntoView;
/**
 * Function to help enter and exit grid using the keyboard
 * @param element grid being focused
 * @param tableOptions provide access to table api
 * @param lastFilter final filter input before entering the grid
 */
function tabToGrid(event, tableOptions, lastFilter) {
    if (event.relatedTarget !== null && event.relatedTarget.tagName === 'INPUT') {
        // scrolls to the first row
        tableOptions.api.ensureIndexVisible(0);
        // scrolls to the first column
        var firstCol = tableOptions.columnApi.getAllDisplayedColumns()[0];
        tableOptions.api.ensureColumnVisible(firstCol);
        // sets focus into the first grid cell
        tableOptions.api.setFocusedCell(0, firstCol);
    }
    else {
        lastFilter.focus();
    }
}
exports.tabToGrid = tabToGrid;
