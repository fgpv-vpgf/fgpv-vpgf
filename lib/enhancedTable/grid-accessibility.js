"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mousedown = false;
var onGridTab;
var onFocusOutOfView;
/**
 * Initialize listeners that help with accessibility
 * @param panel the table panel
 * @param gridBody element containing the grid
 * @param tableOptions table options object
 */
function initAccessibilityListeners(panel, gridBody, tableOptions) {
    onFocusOutOfView = function (event) {
        scrollIntoView(event, panel);
    };
    onGridTab = function (event) {
        tabToGrid(event, tableOptions, panel);
    };
    panel.addEventListener('focus', onFocusOutOfView, true);
    gridBody.addEventListener('focus', onGridTab, false);
    // Don't link last filter to first cell if using the mouse to focus grid
    gridBody.addEventListener('mousedown', onMousedown);
    gridBody.addEventListener('mouseup', onMouseup);
}
exports.initAccessibilityListeners = initAccessibilityListeners;
/**
 * Remove all accessibility listeners from the table
 * @param panel the table panel
 * @param gridBody element containing the grid
 */
function removeAccessibilityListeners(panel, gridBody) {
    panel.removeEventListener('focus', onFocusOutOfView, true);
    gridBody.removeEventListener('focus', onGridTab, true);
    gridBody.removeEventListener('mousedown', onMousedown);
    gridBody.removeEventListener('mouseup', onMouseup);
}
exports.removeAccessibilityListeners = removeAccessibilityListeners;
/**
 * Helper function to handle the mousedown event
 * @param event event handler param
 */
function onMousedown(event) {
    mousedown = true;
}
/**
 * Helper function to handle the mouseup event
 * @param event event handler param
 */
function onMouseup(event) {
    mousedown = false;
}
/**
 * Function to ensure focused column filter is scrolled into view
 * @param element filter being focused
 * @param panel table panel with scrollbar
 */
function scrollIntoView(event, panel) {
    var element = event.target;
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
/**
 * Function to help enter and exit grid using the keyboard
 * @param element grid being focused
 * @param tableOptions provide access to table api
 * @param lastFilter final filter input before entering the grid
 */
function tabToGrid(event, tableOptions, panel) {
    if (!mousedown) {
        if (event.relatedTarget !== null && event.relatedTarget.tagName === 'INPUT') {
            // scrolls to the first row
            tableOptions.api.ensureIndexVisible(0);
            // scrolls to the first column
            var firstCol = tableOptions.columnApi.getAllDisplayedColumns()[0];
            tableOptions.api.ensureColumnVisible(firstCol);
            // let firstCell = <HTMLElement>panel.getElementsByClassName('ag-cell')[0];
            // sets focus into the first grid cell
            // setTimeout(() => tableOptions.api.setFocusedCell(0, firstCol), 10);
            tableOptions.api.setFocusedCell(0, firstCol);
        }
        else {
            var headers = panel.getElementsByClassName('ag-header-cell');
            var filters = headers[headers.length - 1].getElementsByTagName('INPUT');
            var lastFilter = filters[filters.length - 1]; // final filter before grid
            lastFilter.focus();
        }
    }
}
