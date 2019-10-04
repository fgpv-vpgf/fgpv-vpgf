/**
 * Manages the status to be displayed at any given time for an enhancedTable. One PanelStatusManager is created for one PanelManager.
 *
 * Status is updated based on layer visibility, symbol visibilty, text filters, scrolling, and table min/maxing.
 */
export declare class PanelStatusManager {
    constructor(panelManager: any);
    setFilterAndScrollWatch(): void;
    getFilterStatus(): void;
    getScrollRange(): string;
}
export interface PanelStatusManager {
    panelManager: any;
    tableOptions: any;
}
