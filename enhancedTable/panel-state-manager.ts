import { PanelManager } from './panel-manager';

/**
 * Saves relevant enhancedTable states so that it can be reset on reload/reopen. A PanelStateManager is linked to a BaseLayer.
 * setters are called each time enhancedTable states are updated, getters are called each time enhancedTable is reloaded/reopened.
 * States to save and reset:
 *      - displayed rows (on symbology and layer visibility updates)
 *      - column filters
 *      - whether table maximized is in maximized or split view
 */
export class PanelStateManager {

    constructor(baseLayer: any) {
        this.baseLayer = baseLayer;
        this.isMaximized = baseLayer.table.maximize || false;
        this.columnFilters = {};
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

}

export interface PanelStateManager {
    baseLayer: any;
    isMaximized: boolean;
    rows: any;
    columnFilters: any;
}
