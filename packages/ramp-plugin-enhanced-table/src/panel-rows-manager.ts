/**
 * Manages the rows to be displayed at any given time for an enhancedTable. One PanelRowsManager is created for one PanelManager.
 *
 * Rows are updated based on filters set, layer visibility, and symbology visibility.
 */
export class PanelRowsManager {

    constructor(panelManager: any) {
        this.panelManager = panelManager;
        this.tableOptions = panelManager.tableOptions;
        this.mapApi = panelManager.mapApi;
    }

    /**
     * Table is set up according to layer visibiltiy on open
     * Observers are set up in case of change to layer visibility or symbol visibility
     */
    initObservers() {
        this.legendBlock = this.panelManager.legendBlock;
        this.currentTableLayer = this.panelManager.currentTableLayer;
        this.initTableRowVisibility();

        // If extent filter is enabled, apply the extent filter on init
        if (this.panelManager.panelStateManager.filterByExtent) {
            this.filterByExtent(this.mapApi.mapI.extent);
        }

        // Subscribers
        // Filter all rows when visibility is off and none when it's on
        // Requires a separate check since it's not handled as a filter change
        this.layerVisibilityObserver = this.legendBlock.visibilityChanged.subscribe(visibility => {
            this.validOids = visibility ? undefined : [];
            this.externalFilter = !visibility;
            this.updateGridFilters();
        });

        // Update table on map filter change
        this.mapFilterChangedObserver = this.mapApi.filterChanged.subscribe((params) =>  {
            const filterTypes = this.legendBlock.proxyWrapper.filterState.coreFilterTypes;
            if (params.filterType === filterTypes.EXTENT) {
                this.filterByExtent(params.extent)
            } else if (params.filterType !== filterTypes.GRID) {
                // Filter table if not GRID or EXTENT filter
                const layerMatch = this.legendBlock.parentLayerType === 'esriDynamic'
                                    ? params.layerID === this.legendBlock.layerRecordId && params.layerIdx === this.legendBlock.itemIndex
                                    : params.layerID === this.legendBlock.layerRecordId;
                if (layerMatch) {
                    this.fetchValidOids(this.extent);
                }
            }
        });
    }

    /**
     * Destroy observers when table is closed
     */
    destroyObservers() {
        this.layerVisibilityObserver.unsubscribe();
        this.mapFilterChangedObserver.unsubscribe();
    }

    /**
     * Helper method to initTableRowVisibility
     * Sets table filters based on table visibility on open
     */
    initialFilterSettings() {
        if (!this.currentTableLayer.visibility) {
            // if  layer is invisible, table needs to show zero entries
            this.validOids = []
            this.externalFilter = true;
            this.updateGridFilters();
        } else {
            this.fetchValidOids(this.extent);
        }
    }

    /**
     * Helper method to initObservers
     * Sets up initial row visibility based on layer visibility and symbology visibilities on open
     */
    initTableRowVisibility() {

        if (this.legendBlock.visibility === false) {
            // if the legendBlock is invisible on table open, table rows should be empty
            this.validOids = [];
            this.externalFilter = true;
            this.updateGridFilters();
        }
        if (this.tableOptions.api) {
            let that = this;

            // gets called in case a symbolology stack has some symbologies toggled on/off
            this.tableOptions.isExternalFilterPresent = function () {
                return that.externalFilter && that.validOids !== undefined;
            };

            // passes row nodes to be visible whose corresponding symbologies are visible
            this.tableOptions.doesExternalFilterPass = function (node) {
                let oidField = that.legendBlock.proxyWrapper.proxy.oidField;
                return that.validOids !== undefined ? that.validOids.indexOf(node.data[oidField]) > -1 : true;
            };

            this.initialFilterSettings();
        }
    }

    /**
     * Helper method to multiple methods
     * Tricks ag-grid into updating filter status by selecting all filtered rows
     */
    updateGridFilters() {
        this.tableOptions.api.onFilterChanged();
    }

    /** Filter by extent if enabled */
    filterByExtent(extent) {
        this.extent = extent;
        if (this.panelManager.panelStateManager.filterByExtent) {
            this.fetchValidOids(this.extent);
        }
    }

    /**
     * Helper method to fetch valid oids from the map
     */
    fetchValidOids(extent?: any) {
        // get all filtered oids, but exclude any filters created by the grid itself
        const filterExtent = this.panelManager.panelStateManager.filterByExtent ? extent : undefined;
        const filter = this.legendBlock.proxyWrapper.filterState;
        filter.getFilterOIDs([filter.coreFilterTypes.GRID], filterExtent).then(oids => {
            // filter symbologies if there's a filter applied
            this.validOids = oids === null ? [] : oids;
            this.externalFilter = oids !== undefined;
            this.updateGridFilters();
        });
    }
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
    extent: any; // implement after extent filter fixes
    layerVisibilityObserver: any;
    mapFilterChangedObserver: any
}
