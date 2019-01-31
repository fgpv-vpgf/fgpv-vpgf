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

        // Subscribers
        // Filter all rows when visibility is off
        this.layerVisibilityObserver = this.legendBlock.visibilityChanged.subscribe(visibility => {
            this.validOids = visibility ? undefined : [];
            this.externalFilter = !visibility;
            this.updateGridFilters();
        });

        // Fetch valid rows and filter table on symbol toggle
        this.symbolVisibilityObserver = this.legendBlock.symbolVisibilityChanged.subscribe(() => {
            this.fetchValidOids(this.extent);
        });
    }

    /**
    * Destroy observers when table is closed
    */
    destroyObservers() {
        this.layerVisibilityObserver.unsubscribe();
        this.symbolVisibilityObserver.unsubscribe();
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
        this.tableOptions.api.selectAllFiltered();
        this.panelManager.panelStatusManager.getFilterStatus();
        this.tableOptions.api.deselectAllFiltered();
    }

    /**
     * Helper method to fetch valid oids from the map
     */
    fetchValidOids(extent?: any) {
        this.legendBlock.proxyWrapper.filterState.getNonGridFilterOIDs(extent).then(oids => {
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
    symbolVisibilityObserver: any;
}
