/**
 * Function to ensure focused column filter is scrolled into view
 * @param element filter being focused
 * @param panel table panel with scrollbar
 */
export function scrollIntoView(element: any, panel: HTMLElement) {
    element = element.target;
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
export function tabToGrid(event: any, tableOptions: any, lastFilter: HTMLElement) {
    if (event.relatedTarget !== null && event.relatedTarget.tagName === 'INPUT') {
        // scrolls to the first row
        tableOptions.api.ensureIndexVisible(0);

        // scrolls to the first column
        let firstCol = tableOptions.columnApi.getAllDisplayedColumns()[0];
        tableOptions.api.ensureColumnVisible(firstCol);

        // sets focus into the first grid cell
        tableOptions.api.setFocusedCell(0, firstCol);
   } else {
       lastFilter.focus();
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
