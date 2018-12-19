/**
 * Manages the rows to be displayed at any given time for an enhancedTable. One PanelRowsManager is created for one PanelManager.
 *
 * Rows are updated based on filters set, layer visibility, and symbology visibility.
 */
export class PanelRowsManager {

    constructor(panelManager: any) {
        this.panelManager = panelManager;
        this.tableOptions = panelManager.tableOptions;
    }

    // table is set up according to layer visibiltiy on open
    // observers are set up in case of change to layer visibility or symbol visibility
    initObservers() {
        this.legendBlock = this.panelManager.legendBlock;
        this.currentTableLayer = this.panelManager.currentTableLayer;
        this.initTableRowVisibility();
        this.layerVisibilityObserver();
        this.symbolVisibilityObserver();
    }

    // helper method to initTableRowVisibility
    // sets table filters based on table visibility on open
    initialFilterSettings() {
        if (!this.currentTableLayer.visibility) {
            // if  layer is invisible, table needs to show zero entries
            this.tableOptions.api.setQuickFilter('1=2');
            this.quickFilterText = '1=2';
        } else if (this.legendBlock.validOIDs !== undefined) {
            // if validOIDs are defined, filter symbologies
            this.externalFilter = true;
            this.updateGridFilters();
        }
    }

    // helper method to initObservers
    // sets up initial row visibility based on layer visibility and symbology visibilities on open
    initTableRowVisibility() {
        if (this.tableOptions.api) {
            let that = this;

            // gets called in case a symbolology stack has some symbologies toggled on/off
            this.tableOptions.isExternalFilterPresent = function () {
                return that.externalFilter && that.legendBlock.validOIDs !== undefined;
            }

            // passes row nodes to be visible whose corresponding symbologies are visible
            this.tableOptions.doesExternalFilterPass = function (node) {
                let oidField = that.legendBlock.proxyWrapper.proxy.oidField;
                return that.legendBlock.validOIDs.includes(node.data[oidField]);
            }

            this.initialFilterSettings();
        }
    }

    // helper method to layerVisibilityObserver
    // saves table filters for when a LegendNode gets toggled to invisible
    invisibileNodeFilterSettings() {
        //if set to invisible: store current filter, and then filter out all visible rows
        this.tableOptions.api.validOIDs = undefined;
        this.storedFilter = this.tableOptions.api.getFilterModel();
        this.prevQuickFilterText = this.quickFilterText;
        this.tableOptions.api.setQuickFilter('1=2');
        this.quickFilterText = '1=2';
        this.visibility = false;
        this.tableOptions.api.selectAllFiltered();
        this.panelManager.panelStatusManager.getFilterStatus();
        this.tableOptions.api.deselectAllFiltered();
    }

    // helper method to layerVisibilityObserver
    // resets/updates table filters for when a LegendNode gets toggled to visible
    visibileNodeFilterSettings() {
        // if set to visibile: show all rows and clear external filter (because all symbologies will be checked in)
        if (this.prevQuickFilterText !== undefined && this.prevQuickFilterText !== '1=2') {
            this.tableOptions.api.setQuickFilter(this.prevQuickFilterText);
            this.quickFilterText = this.prevQuickFilterText;
        }
        else {
            this.tableOptions.api.setQuickFilter('');
            this.quickFilterText = '';
        }
        this.externalFilter = false;
        this.tableOptions.api.onFilterChanged();
        if (this.storedFilter !== undefined) {
            // if any filter was previously stored reset it
            this.tableOptions.api.setFilterModel(this.storedFilter);
            this.storedFilter = undefined;
        }
        this.visibility = true;
        this.tableOptions.api.selectAllFiltered();
        this.panelManager.panelStatusManager.getFilterStatus();
        this.tableOptions.api.deselectAllFiltered();
    }

    // helper method to layerVisibilityObserver
    // saves table filters for when a LegendSet gets toggled to invisible
    invisibleSetFilterSettings() {
        this.storedFilter = this.tableOptions.api.getFilterModel();
        this.tableOptions.api.setQuickFilter('1=2');
        this.quickFilterText = '1=2';
        this.visibility = false;
    }

    // helper method to layerVisibilityObserver
    // resets/updates table filters for when a LegendSet gets toggled to visible
    visibleSetFilterSettings() {
        this.tableOptions.api.setQuickFilter('');
        this.quickFilterText = '';
        if (this.storedFilter !== undefined) {
            // if any filter was previously stored reset it
            this.tableOptions.api.setFilterModel(this.storedFilter);
            this.storedFilter = undefined;
        }
        this.visibility = true;
    }

    // helper method to initObservers
    // saves table and update table filter states upon layer visibilty changes
    layerVisibilityObserver() {
        this.legendBlock.visibilityChanged.subscribe(visibility => {
            if (this.tableOptions.api
                && this.currentTableLayer.visibility === visibility
                && visibility !== this.panelManager.visibility) {

                if (!visibility) {
                    this.invisibileNodeFilterSettings();
                } else {
                    this.visibileNodeFilterSettings();
                }
            }
            else if (this.legendBlock.parent.blockType === 'set' && this.legendBlock.visibility === visibility) {
                // sets don't follow the same logic; the layer visibility changes after the block is selected/unselected
                if (!visibility) {
                    this.invisibleSetFilterSettings();
                } else {
                    this.visibleSetFilterSettings();
                }
            }
        });
    }

    // helper method to multiple methods
    // tricks ag-grid into updating filter status by selecting all filtered rows
    updateGridFilters() {
        this.tableOptions.api.onFilterChanged();
        this.tableOptions.api.selectAllFiltered();
        this.panelManager.panelStatusManager.getFilterStatus();
        this.tableOptions.api.deselectAllFiltered();
    }

    // helper method to symboLVisibilityObserver
    // updates table filter states
    setFiltersOnSymbolUpdate() {
        if (this.quickFilterText === '1=2') {
            // if this is a symbol being toggled on which sets layer visibility to true
            if (this.prevQuickFilterText === undefined) {
                //clear the undefined quick filter if no quick filter was stored
                this.tableOptions.api.setQuickFilter('');
                this.quickFilterText = '';
            } else {
                // clear the undefined quick filter and restore the previous quick filter
                this.tableOptions.api.setQuickFilter(this.prevQuickFilterText);
                this.quickFilterText = this.prevQuickFilterText;
                this.prevQuickFilterText = undefined
            }
            if (this.storedFilter !== undefined) {
                // if any column filters were previously stored, restore them
                this.tableOptions.api.setFilterModel(this.storedFilter);
                this.storedFilter = undefined;
            }
        }
    }

    // helper method to initObservers
    // saves table and update table filter states upon symbol visibilty changes
    symbolVisibilityObserver() {
        // when one of the symbols are toggled on/off, filter the table
        this.legendBlock.symbolVisibilityChanged.subscribe(visibility => {
            if (visibility === undefined && this.externalFilter !== false && this.legendBlock.symbDefinitionQuery === undefined) {
                // this ensures external filter is turned off in the scenario where the last symbology toggle is selected
                this.externalFilter = false;
                this.updateGridFilters();
            } else if (visibility !== undefined) {
                // this ensures proper symbologies are filtered out
                this.externalFilter = true;
                this.setFiltersOnSymbolUpdate();
                this.updateGridFilters();
            }
        });
    }
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
