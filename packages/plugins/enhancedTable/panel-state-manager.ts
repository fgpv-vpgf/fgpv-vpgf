/**
 * Saves relevant enhancedTable states so that it can be reset on reload/reopen. A PanelStateManager is linked to a BaseLayer.
 * setters are called each time enhancedTable states are updated, getters are called each time enhancedTable is reloaded/reopened.
 * States to save and reset:
 *      - displayed rows (on symbology and layer visibility updates)
 *      - column filters
 *      - column sorts
 *      - whether table maximized is in maximized or split view
 */
export class PanelStateManager {
    constructor(baseLayer: any, legendBlock: any) {
        this.baseLayer = baseLayer;
        this.isMaximized = baseLayer.table.maximize || false;
        this.showFilter = baseLayer.table.showFilter;
        this.filterByExtent = baseLayer.table.filterByExtent || false;
        this.columnFilters = {};
        this.open = true;
        this.storedBlock = legendBlock;
        this.columnState = null;
    }

    getColumnFilter(colDefField: string): any {
        return this.columnFilters[colDefField];
    }

    setColumnFilter(colDefField: string, filterValue: any): void {
        let newFilterValue = filterValue;
        if (filterValue && typeof filterValue === 'string') {
            const escRegex = /[(!"#$%&\'+,.\\\/:;<=>?@[\]^`{|}~)]/g;
            newFilterValue = filterValue.replace(escRegex, '\\$&');
        }
        this.columnFilters[colDefField] = newFilterValue;
    }

    get sortModel(): any {
        return this.storedSortModel;
    }

    set sortModel(sortModel: any) {
        this.storedSortModel = sortModel;
    }

    set maximized(maximized: boolean) {
        this.isMaximized = maximized;
    }

    get maximized(): boolean {
        return this.isMaximized;
    }

    get colFilter(): boolean {
        return this.showFilter;
    }

    set colFilter(show: boolean) {
        this.showFilter = show;
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
    showFilter: boolean;
    filterByExtent: boolean;
    rows: any;
    columnFilters: any;
    open: boolean;
    storedSortModel: any;
    storedBlock: any;
    columnState: any;
}
