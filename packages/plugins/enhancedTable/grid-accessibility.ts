let mousedown = false;
let onGridTab;
let onFocusOutOfView;

/**
 * Initialize listeners that help with accessibility
 * @param panel the table panel
 * @param gridBody element containing the grid
 * @param tableOptions table options object
 */
export function initAccessibilityListeners(panel: HTMLElement, gridBody: HTMLElement, tableOptions: any) {
    onFocusOutOfView = (event: any) => {
        scrollIntoView(event, panel);
    }

    onGridTab = (event: any) => {
        tabToGrid(event, tableOptions, panel);
    }

    panel.addEventListener('focus', onFocusOutOfView, true);

    gridBody.addEventListener('focus', onGridTab, false);
    // Don't link last filter to first cell if using the mouse to focus grid
    gridBody.addEventListener('mousedown', onMousedown);
    gridBody.addEventListener('mouseup', onMouseup)
}

/**
 * Remove all accessibility listeners from the table
 * @param panel the table panel
 * @param gridBody element containing the grid
 */
export function removeAccessibilityListeners(panel:HTMLElement, gridBody: HTMLElement) {
    panel.removeEventListener('focus', onFocusOutOfView, true);
    gridBody.removeEventListener('focus', onGridTab, true);
    gridBody.removeEventListener('mousedown', onMousedown);
    gridBody.removeEventListener('mouseup', onMouseup);
}

/**
 * Helper function to handle the mousedown event
 * @param event event handler param
 */
function onMousedown(event: any) {
    mousedown = true;
}

/**
 * Helper function to handle the mouseup event
 * @param event event handler param
 */
function onMouseup(event: any) {
    mousedown = false;
}

/**
 * Function to ensure focused column filter is scrolled into view
 * @param element filter being focused
 * @param panel table panel with scrollbar
 */
function scrollIntoView(event: any, panel: HTMLElement) {
    let element = event.target;
    let container = <HTMLElement>panel.getElementsByClassName('ag-body-viewport')[0];
    const { elementRect, containerRect, offset } = getOffset(element, container);
    let offsetDelta: number = 0;
    if (offset.left < 0) {
        offsetDelta = offset.left;
    } else if (offset.left + elementRect.width > containerRect.width) {
        offsetDelta = offset.left + elementRect.width - containerRect.width;
    }

    if (offsetDelta !== 0) {
        container.scrollLeft += offsetDelta;
    }

    function getOffset(element: HTMLElement, container: HTMLElement): ElementOffset {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        return {
            elementRect,
            containerRect,
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
function tabToGrid (event: any, tableOptions: any, panel: HTMLElement) {
    if (!mousedown) {
        if (event.relatedTarget !== null && event.relatedTarget.tagName === 'INPUT') {
            // scrolls to the first row
            tableOptions.api.ensureIndexVisible(0);

            // scrolls to the first column
            let firstCol = tableOptions.columnApi.getAllDisplayedColumns()[0];
            tableOptions.api.ensureColumnVisible(firstCol);

            // let firstCell = <HTMLElement>panel.getElementsByClassName('ag-cell')[0];

            // sets focus into the first grid cell
            // setTimeout(() => tableOptions.api.setFocusedCell(0, firstCol), 10);
            tableOptions.api.setFocusedCell(0, firstCol);

        } else {
            let headers = panel.getElementsByClassName('ag-header-cell');
            let filters = headers[headers.length - 1].getElementsByTagName('INPUT');
            let lastFilter = <HTMLElement>filters[filters.length - 1]; // final filter before grid
            lastFilter.focus();
        }
    }
}

interface ElementOffset {
    elementRect: ClientRect|DOMRect;
    containerRect: ClientRect|DOMRect;
    offset: Offset;
}

interface Offset {
    top: number;
    left: number;
}
