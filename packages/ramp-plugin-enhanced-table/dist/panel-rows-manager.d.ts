/**
 * Manages the rows to be displayed at any given time for an enhancedTable. One PanelRowsManager is created for one PanelManager.
 *
 * Rows are updated based on filters set, layer visibility, and symbology visibility.
 */
export declare class PanelRowsManager {
    constructor(panelManager: any);
    /**
     * Table is set up according to layer visibiltiy on open
     * Observers are set up in case of change to layer visibility or symbol visibility
     */
    initObservers(): void;
    /**
     * Destroy observers when table is closed
     */
    destroyObservers(): void;
    /**
     * Helper method to initTableRowVisibility
     * Sets table filters based on table visibility on open
     */
    initialFilterSettings(): void;
    /**
     * Helper method to initObservers
     * Sets up initial row visibility based on layer visibility and symbology visibilities on open
     */
    initTableRowVisibility(): void;
    /**
     * Helper method to multiple methods
     * Tricks ag-grid into updating filter status by selecting all filtered rows
     */
    updateGridFilters(): void;
    /** Filter by extent if enabled */
    filterByExtent(extent: any): void;
    /**
     * Helper method to fetch valid oids from the map
     */
    fetchValidOids(extent?: any): void;
}
export interface PanelRowsManager {
    panelManager: any;
    tableOptions: any;
    mapApi: any;
    visibility: boolean;
    storedFilter: any;
    prevQuickFilterText: any;
    quickFilterText: any;
    externalFilter: boolean;
    legendBlock: any;
    currentTableLayer: any;
    validOids: number[];
    extent: any;
    layerVisibilityObserver: any;
    mapFilterChangedObserver: any;
}
