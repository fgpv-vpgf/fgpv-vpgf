"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Manages the rows to be displayed at any given time for an enhancedTable. One PanelRowsManager is created for one PanelManager.
 *
 * Rows are updated based on filters set, layer visibility, and symbology visibility.
 */
var PanelRowsManager = /** @class */ (function () {
    function PanelRowsManager(panelManager) {
        this.panelManager = panelManager;
        this.tableOptions = panelManager.tableOptions;
        this.mapApi = panelManager.mapApi;
    }
    /**
     * Table is set up according to layer visibiltiy on open
     * Observers are set up in case of change to layer visibility or symbol visibility
     */
    PanelRowsManager.prototype.initObservers = function () {
        var _this = this;
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
        this.layerVisibilityObserver = this.legendBlock.visibilityChanged.subscribe(function (visibility) {
            _this.validOids = visibility ? undefined : [];
            _this.externalFilter = !visibility;
            _this.updateGridFilters();
        });
        // Update table on map filter change
        this.mapFilterChangedObserver = this.mapApi.filterChanged.subscribe(function (params) {
            var filterTypes = _this.legendBlock.proxyWrapper.filterState.coreFilterTypes;
            if (params.filterType === filterTypes.EXTENT) {
                _this.filterByExtent(params.extent);
            }
            else if (params.filterType !== filterTypes.GRID) {
                // Filter table if not GRID or EXTENT filter
                var layerMatch = _this.legendBlock.parentLayerType === 'esriDynamic'
                    ? params.layerID === _this.legendBlock.layerRecordId && params.layerIdx === _this.legendBlock.itemIndex
                    : params.layerID === _this.legendBlock.layerRecordId;
                if (layerMatch) {
                    _this.fetchValidOids(_this.extent);
                }
            }
        });
    };
    /**
     * Destroy observers when table is closed
     */
    PanelRowsManager.prototype.destroyObservers = function () {
        this.layerVisibilityObserver.unsubscribe();
        this.mapFilterChangedObserver.unsubscribe();
    };
    /**
     * Helper method to initTableRowVisibility
     * Sets table filters based on table visibility on open
     */
    PanelRowsManager.prototype.initialFilterSettings = function () {
        if (!this.currentTableLayer.visibility) {
            // if  layer is invisible, table needs to show zero entries
            this.validOids = [];
            this.externalFilter = true;
            this.updateGridFilters();
        }
        else {
            this.fetchValidOids(this.extent);
        }
    };
    /**
     * Helper method to initObservers
     * Sets up initial row visibility based on layer visibility and symbology visibilities on open
     */
    PanelRowsManager.prototype.initTableRowVisibility = function () {
        if (this.legendBlock.visibility === false) {
            // if the legendBlock is invisible on table open, table rows should be empty
            this.validOids = [];
            this.externalFilter = true;
            this.updateGridFilters();
        }
        if (this.tableOptions.api) {
            var that_1 = this;
            // gets called in case a symbolology stack has some symbologies toggled on/off
            this.tableOptions.isExternalFilterPresent = function () {
                return that_1.externalFilter && that_1.validOids !== undefined;
            };
            // passes row nodes to be visible whose corresponding symbologies are visible
            this.tableOptions.doesExternalFilterPass = function (node) {
                var oidField = that_1.legendBlock.proxyWrapper.proxy.oidField;
                return that_1.validOids !== undefined ? that_1.validOids.indexOf(node.data[oidField]) > -1 : true;
            };
            this.initialFilterSettings();
        }
    };
    /**
     * Helper method to multiple methods
     * Tricks ag-grid into updating filter status by selecting all filtered rows
     */
    PanelRowsManager.prototype.updateGridFilters = function () {
        this.tableOptions.api.onFilterChanged();
    };
    /** Filter by extent if enabled */
    PanelRowsManager.prototype.filterByExtent = function (extent) {
        this.extent = extent;
        if (this.panelManager.panelStateManager.filterByExtent) {
            this.fetchValidOids(this.extent);
        }
    };
    /**
     * Helper method to fetch valid oids from the map
     */
    PanelRowsManager.prototype.fetchValidOids = function (extent) {
        var _this = this;
        // get all filtered oids, but exclude any filters created by the grid itself
        var filterExtent = this.panelManager.panelStateManager.filterByExtent ? extent : undefined;
        var filter = this.legendBlock.proxyWrapper.filterState;
        filter.getFilterOIDs([filter.coreFilterTypes.GRID], filterExtent).then(function (oids) {
            // filter symbologies if there's a filter applied
            _this.validOids = oids === null ? [] : oids;
            _this.externalFilter = oids !== undefined;
            _this.updateGridFilters();
        });
    };
    return PanelRowsManager;
}());
exports.PanelRowsManager = PanelRowsManager;
