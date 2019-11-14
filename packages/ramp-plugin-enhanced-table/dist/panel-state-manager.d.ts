/**
 * Saves relevant enhancedTable states so that it can be reset on reload/reopen. A PanelStateManager is linked to a BaseLayer.
 * setters are called each time enhancedTable states are updated, getters are called each time enhancedTable is reloaded/reopened.
 * States to save and reset:
 *      - displayed rows (on symbology and layer visibility updates)
 *      - column filters
 *      - column sorts
 *      - whether table maximized is in maximized or split view
 */
export declare class PanelStateManager {
    constructor(baseLayer: any, legendBlock: any);
    getColumnFilter(colDefField: string): any;
    setColumnFilter(colDefField: string, filterValue: any): void;
    sortModel: any;
    maximized: boolean;
    colFilter: boolean;
    isOpen: boolean;
    readonly legendBlock: any;
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
