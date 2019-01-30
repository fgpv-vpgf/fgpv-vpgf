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
    * Helper method to layerVisibilityObserver
    * Saves table filters for when a LegendNode gets toggled to invisible
    */
    invisibileNodeFilterSettings(): void;
    /**
    * Helper method to layerVisibilityObserver
    * Resets/updates table filters for when a LegendNode gets toggled to visible
    */
    visibileNodeFilterSettings(): void;
    /**
    * Helper method to layerVisibilityObserver
    * Saves table filters for when a LegendSet gets toggled to invisible
    */
    invisibleSetFilterSettings(): void;
    /**
    * Helper method to layerVisibilityObserver
    * Resets/updates table filters for when a LegendSet gets toggled to visible
    */
    visibleSetFilterSettings(): void;
    /**
    * Helper method to initObservers
    * Saves table and update table filter states upon layer visibilty changes
    */
    layerVisibilityObserver(): void;
    /**
    * Helper method to multiple methods
    * Tricks ag-grid into updating filter status by selecting all filtered rows
    */
    updateGridFilters(): void;
    /**
    * Helper method to symbolVisibilityObserver
    * Updates table filter states
    */
    setFiltersOnSymbolUpdate(): void;
    /**
    * Helper method to initObservers
    * Saves table and updates table filter states upon symbol visibilty changes
    */
    symbolVisibilityObserver(): void;
}
export interface PanelRowsManager {
    panelManager: any;
    tableOptions: any;
    visibility: boolean;
    storedFilter: any;
    prevQuickFilterText: any;
    quickFilterText: any;
    externalFilter: boolean;
    legendBlock: any;
    currentTableLayer: any;
}
