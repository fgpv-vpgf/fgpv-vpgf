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
    }
    /**
    * Table is set up according to layer visibiltiy on open
    * Observers are set up in case of change to layer visibility or symbol visibility
    */
    PanelRowsManager.prototype.initObservers = function () {
        this.legendBlock = this.panelManager.legendBlock;
        this.currentTableLayer = this.panelManager.currentTableLayer;
        this.initTableRowVisibility();
        this.layerVisibilityObserver();
        this.symbolVisibilityObserver();
    };
    /**
    * Helper method to initTableRowVisibility
    * Sets table filters based on table visibility on open
    */
    PanelRowsManager.prototype.initialFilterSettings = function () {
        if (!this.currentTableLayer.visibility) {
            // if  layer is invisible, table needs to show zero entries
            this.tableOptions.api.setQuickFilter('1=2');
            this.quickFilterText = '1=2';
        }
        else if (this.legendBlock.validOIDs !== undefined) {
            // if validOIDs are defined, filter symbologies
            this.externalFilter = true;
            this.updateGridFilters();
        }
    };
    /**
     * Helper method to initObservers
     * Sets up initial row visibility based on layer visibility and symbology visibilities on open
     */
    PanelRowsManager.prototype.initTableRowVisibility = function () {
        if (this.legendBlock.visibility === false) {
            // if the legendBlock is invisible on table open, table rows should be empty
            if (this.legendBlock.parent.blockType === 'set') {
                this.invisibleSetFilterSettings();
            }
            else {
                this.invisibileNodeFilterSettings();
            }
        }
        if (this.tableOptions.api) {
            var that_1 = this;
            // gets called in case a symbolology stack has some symbologies toggled on/off
            this.tableOptions.isExternalFilterPresent = function () {
                return that_1.externalFilter && that_1.legendBlock.validOIDs !== undefined;
            };
            // passes row nodes to be visible whose corresponding symbologies are visible
            this.tableOptions.doesExternalFilterPass = function (node) {
                var oidField = that_1.legendBlock.proxyWrapper.proxy.oidField;
                return that_1.legendBlock.validOIDs.includes(node.data[oidField]);
            };
            this.initialFilterSettings();
        }
    };
    /**
    * Helper method to layerVisibilityObserver
    * Saves table filters for when a LegendNode gets toggled to invisible
    */
    PanelRowsManager.prototype.invisibileNodeFilterSettings = function () {
        //if set to invisible: store current filter, and then filter out all visible rows
        if (this.quickFilterText !== '1=2') {
            this.tableOptions.api.validOIDs = undefined;
            this.prevQuickFilterText = this.quickFilterText;
            this.tableOptions.api.setQuickFilter('1=2');
            this.quickFilterText = '1=2';
            this.visibility = false;
            this.tableOptions.api.selectAllFiltered();
            this.panelManager.panelStatusManager.getFilterStatus();
            this.tableOptions.api.deselectAllFiltered();
        }
    };
    /**
    * Helper method to layerVisibilityObserver
    * Resets/updates table filters for when a LegendNode gets toggled to visible
    */
    PanelRowsManager.prototype.visibileNodeFilterSettings = function () {
        // if set to visibile: show all rows and clear external filter (because all symbologies will be checked in)
        if (this.prevQuickFilterText !== undefined && this.prevQuickFilterText !== '1=2') {
            this.tableOptions.api.setQuickFilter(this.prevQuickFilterText);
            this.quickFilterText = this.prevQuickFilterText;
        }
        else {
            this.tableOptions.api.setQuickFilter(this.panelManager.searchText);
            this.quickFilterText = this.panelManager.searchText;
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
    };
    /**
    * Helper method to layerVisibilityObserver
    * Saves table filters for when a LegendSet gets toggled to invisible
    */
    PanelRowsManager.prototype.invisibleSetFilterSettings = function () {
        this.tableOptions.api.setQuickFilter('1=2');
        this.quickFilterText = '1=2';
        this.visibility = false;
    };
    /**
    * Helper method to layerVisibilityObserver
    * Resets/updates table filters for when a LegendSet gets toggled to visible
    */
    PanelRowsManager.prototype.visibleSetFilterSettings = function () {
        this.tableOptions.api.setQuickFilter('');
        this.quickFilterText = '';
        if (this.storedFilter !== undefined) {
            // if any filter was previously stored reset it
            this.tableOptions.api.setFilterModel(this.storedFilter);
            this.storedFilter = undefined;
        }
        this.visibility = true;
    };
    /**
    * Helper method to initObservers
    * Saves table and update table filter states upon layer visibilty changes
    */
    PanelRowsManager.prototype.layerVisibilityObserver = function () {
        var _this = this;
        this.legendBlock.visibilityChanged.subscribe(function (visibility) {
            if (_this.tableOptions.api
                && _this.currentTableLayer.visibility === visibility
                && visibility !== _this.panelManager.visibility) {
                if (!visibility) {
                    _this.invisibileNodeFilterSettings();
                }
                else {
                    _this.visibileNodeFilterSettings();
                }
            }
            else if (_this.legendBlock.parent.blockType === 'set' && _this.legendBlock.visibility === visibility) {
                // sets don't follow the same logic; the layer visibility changes after the block is selected/unselected
                if (!visibility) {
                    _this.invisibleSetFilterSettings();
                }
                else {
                    _this.visibleSetFilterSettings();
                }
            }
        });
    };
    /**
    * Helper method to multiple methods
    * Tricks ag-grid into updating filter status by selecting all filtered rows
    */
    PanelRowsManager.prototype.updateGridFilters = function () {
        this.tableOptions.api.onFilterChanged();
        this.tableOptions.api.selectAllFiltered();
        this.panelManager.panelStatusManager.getFilterStatus();
        this.tableOptions.api.deselectAllFiltered();
    };
    /**
    * Helper method to symbolVisibilityObserver
    * Updates table filter states
    */
    PanelRowsManager.prototype.setFiltersOnSymbolUpdate = function () {
        if (this.quickFilterText === '1=2') {
            // if this is a symbol being toggled on which sets layer visibility to true
            if (this.prevQuickFilterText === undefined) {
                //clear the undefined quick filter if no quick filter was stored
                this.tableOptions.api.setQuickFilter('');
                this.quickFilterText = '';
            }
            else {
                // clear the undefined quick filter and restore the previous quick filter
                this.tableOptions.api.setQuickFilter(this.prevQuickFilterText);
                this.quickFilterText = this.prevQuickFilterText;
                this.prevQuickFilterText = undefined;
            }
            if (this.storedFilter !== undefined) {
                // if any column filters were previously stored, restore them
                this.tableOptions.api.setFilterModel(this.storedFilter);
                this.storedFilter = undefined;
            }
        }
    };
    /**
    * Helper method to initObservers
    * Saves table and updates table filter states upon symbol visibilty changes
    */
    PanelRowsManager.prototype.symbolVisibilityObserver = function () {
        var _this = this;
        // when one of the symbols are toggled on/off, filter the table
        this.legendBlock.symbolVisibilityChanged.subscribe(function (visibility) {
            if (visibility === undefined && _this.externalFilter !== false && _this.legendBlock.symbDefinitionQuery === undefined) {
                // this ensures external filter is turned off in the scenario where the last symbology toggle is selected
                _this.externalFilter = false;
                _this.updateGridFilters();
            }
            else if (visibility !== undefined) {
                // this ensures proper symbologies are filtered out
                _this.externalFilter = true;
                _this.setFiltersOnSymbolUpdate();
                _this.updateGridFilters();
            }
        });
    };
    return PanelRowsManager;
}());
exports.PanelRowsManager = PanelRowsManager;
