/**
 * Saves relevant enhancedTable states so that it can be reset on reload/reopen. A PanelStateManager is linked to a BaseLayer.
 * setters are called each time enhancedTable states are updated, getters are called each time enhancedTable is reloaded/reopened.
 * States to save and reset:
 *      - displayed rows (on symbology and layer visibility updates)
 *      - column filters
 *      - whether table maximized is in maximized or split view
 */
export class PanelStateManager {
    constructor(baseLayer: any, legendBlock: any) {
        this.baseLayer = baseLayer;
        this.isMaximized = baseLayer.table.maximize || false;
        this.filterByExtent = false;
        this.columnFilters = {};
        this.open = true;
        this.storedBlock = legendBlock;
        this.columnState = null;
    }

    getColumnFilter(colDefField: any): any {
        return this.columnFilters[colDefField];
    }

    setColumnFilter(colDefField, filterValue): void {
        this.columnFilters[colDefField] = filterValue;
    }

    set maximized(maximized: boolean) {
        this.isMaximized = maximized;
    }

    get maximized(): boolean {
        return this.isMaximized;
    }

    set isOpen(isOpen: boolean) {
        this.open = isOpen;
    }

    get isOpen(): boolean {
        return this.open;
    }

    get legendBlock(): any {
        return this.storedBlock;
    }
}

export interface PanelStateManager {
    baseLayer: any;
    isMaximized: boolean;
    filterByExtent: boolean;
    rows: any;
    columnFilters: any;
    open: boolean;
    storedBlock: any;
    columnState: any;
}
