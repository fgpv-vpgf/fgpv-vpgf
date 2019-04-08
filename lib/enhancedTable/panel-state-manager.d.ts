/**
 * Saves relevant enhancedTable states so that it can be reset on reload/reopen. A PanelStateManager is linked to a BaseLayer.
 * setters are called each time enhancedTable states are updated, getters are called each time enhancedTable is reloaded/reopened.
 * States to save and reset:
 *      - displayed rows (on symbology and layer visibility updates)
 *      - column filters
 *      - whether table maximized is in maximized or split view
 */
export declare class PanelStateManager {
    constructor(baseLayer: any, legendBlock: any);
    getColumnFilter(colDefField: any): any;
    setColumnFilter(colDefField: any, filterValue: any): void;
    maximized: boolean;
    isOpen: boolean;
    readonly legendBlock: any;
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
