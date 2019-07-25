"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates and manages one table config that corresponds to an enhancedTable.
 *
 * Used to establish default settings on table open as well as table behaviour.
 */
var ConfigManager = /** @class */ (function () {
    function ConfigManager(baseLayer, panelManager) {
        var _this = this;
        //init ConfigManager properties
        this.baseLayer = baseLayer;
        this.panelManager = panelManager;
        this.attributeHeaders = baseLayer.attributeHeaders;
        this.attributeArray = baseLayer._attributeArray;
        this.columnConfigs = {};
        var layerEntries = this.baseLayer._viewerLayer._childTree;
        if (this.baseLayer.table.title !== this.panelManager.legendBlock.name &&
            layerEntries !== undefined) {
            // if these titles are not the same, and the baseLayer has layer entries
            // look for the layer entry with the matching name and set ITS table config as the table config
            var that_1 = this;
            layerEntries.forEach(function (entry) {
                if (entry.proxyWrapper !== undefined && entry.proxyWrapper.name === _this.panelManager.legendBlock.name) {
                    _this.tableConfig = entry.proxyWrapper.layerConfig.source.table !== undefined ?
                        entry.proxyWrapper.layerConfig.source.table : that_1.baseLayer.table;
                }
                else {
                    _this.tableConfig = that_1.baseLayer.table;
                }
            });
        }
        else {
            this.tableConfig = baseLayer.table;
        }
        this.searchEnabled = this.tableConfig.search && this.tableConfig.search.enabled;
        this.tableInit();
    }
    /**
     * Set up table for first time open.
     * Called upon ConfigManager creation which is called on table creation
     */
    ConfigManager.prototype.tableInit = function () {
        var _this = this;
        this.maximize();
        // populate array of column configs
        if (this.tableConfig.columns) {
            this.tableConfig.columns.forEach(function (column) {
                _this.columnConfigs[column.data] = new ColumnConfigManager(_this, column);
            });
        }
    };
    Object.defineProperty(ConfigManager.prototype, "title", {
        /**
         * Returns table title as defined in config, or as the layer name if undefined in the config.
         */
        get: function () {
            return this.tableConfig.title || this.panelManager.legendBlock.name;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Maximizes table on open if maximized is set as true in the config.
     * Helper method to tableInit
     */
    ConfigManager.prototype.maximize = function () {
        var maximized = this.panelManager.panelStateManager.maximized;
        this.panelManager.maximized = maximized;
        this.panelManager.setSize();
    };
    Object.defineProperty(ConfigManager.prototype, "globalSearchEnabled", {
        /**
         * Return whether global search is enabled/disabled according to config (default is enabled)
         */
        get: function () {
            return (this.searchEnabled !== undefined) ? this.searchEnabled : true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "printEnabled", {
        /**
         * Return whether printing is enabled/disabled according to config (default is disabled)
         */
        get: function () {
            return this.tableConfig.printEnabled !== undefined ? this.tableConfig.printEnabled : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "defaultGlobalSearch", {
        /**
         * Gets default search parameter for global search if defined in the config.
         */
        get: function () {
            var searchText = this.tableConfig.search === undefined || this.tableConfig.search.value === undefined ? '' : this.tableConfig.search.value;
            return searchText;
        },
        enumerable: true,
        configurable: true
    });
    ConfigManager.prototype.setDefaultGlobalSearchFilter = function () {
        if (this.globalSearchEnabled) {
            this.panelManager.tableOptions.api.setQuickFilter(this.defaultGlobalSearch);
        }
    };
    Object.defineProperty(ConfigManager.prototype, "lazyFilterEnabled", {
        /**
         * Return whether lazy filter is enabled for the table as defined in config, if undefined defaults to false.
         */
        get: function () {
            return (this.tableConfig.lazyFilter !== undefined) ? this.tableConfig.lazyFilter : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "searchStrictMatchEnabled", {
        /**
         * Return whether strict match is enabled when searching in the table as defined in config, if undefined defaults to false.
         */
        get: function () {
            return (this.tableConfig.searchStrictMatch !== undefined) ? this.tableConfig.searchStrictMatch : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "applyMap", {
        /**
         * Returns if the default filters are applied to the map. If undefined defaults to false
         */
        get: function () {
            return (this.tableConfig.applyMap !== undefined) ? this.tableConfig.applyMap : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "showFilter", {
        /**
         * Returns if the column filters are displayed on the table. If undefined default to true.
         */
        get: function () {
            return (this.tableConfig.showFilter !== undefined) ? this.tableConfig.showFilter : true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "filteredAttributes", {
        /**
         * Returns a list of column data defined in the config, so that the table can be initialized according to them.
         */
        get: function () {
            var filteredAttributes = [];
            if (this.tableConfig.columns !== undefined) {
                this.tableConfig.columns.forEach(function (column) {
                    filteredAttributes.push(column.data);
                });
            }
            return filteredAttributes;
        },
        enumerable: true,
        configurable: true
    });
    return ConfigManager;
}());
exports.ConfigManager = ConfigManager;
/**
 * Creates and manages one column node's config that corresponds to a table config that corresponds to an enhancedTable.
 * Note: one table config can have many column node config specifications
 * Used to establish default settings for columns on table open as well as column behaviour and floating filter behaviours.
 */
var ColumnConfigManager = /** @class */ (function () {
    function ColumnConfigManager(configManager, column) {
        this.configManager = configManager;
        this.column = column;
    }
    Object.defineProperty(ColumnConfigManager.prototype, "width", {
        /**
         * Initializes column width according to specifications in the config on table creation
         * If table needs to be filled up, disregards this width (respects table fill) ..i.e this is the minwidth
         */
        get: function () {
            return (this.column !== undefined) ? this.column.width : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColumnConfigManager.prototype, "sort", {
        /**
         * Initializes column sorts according to specifications in the config on table creation
         * If table needs to be filled up, disregards this width (respects table fill) ..i.e this is the minwidth
         */
        get: function () {
            return (this.column !== undefined) ? this.column.sort : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColumnConfigManager.prototype, "searchDisabled", {
        /**
         * Leaves out floating search bar from column if column is not searchable.
         * Set on table creation
         */
        get: function () {
            if (this.column == undefined || this.column.searchable === undefined) {
                return false;
            }
            return !this.column.searchable;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColumnConfigManager.prototype, "isSelector", {
        /**
         * Returns if the type of filter is selector
         * Selector filter is initiated for when default data field types are string
         * Set up on table create
         */
        get: function () {
            // make comment indicating that that part of the config is ignored entirely if not selector and if default not string
            if (!(this.column === undefined || this.column.filter === undefined || this.column.filter.type === undefined)) {
                return this.column.filter.type === 'selector';
            }
            return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColumnConfigManager.prototype, "isFilterStatic", {
        /**
         * Returns whether filter is static
         * Set up on table create
         */
        get: function () {
            if (!(this.column === undefined || this.column.filter === undefined || this.column.filter.static === undefined)) {
                return this.column.filter.static;
            }
            return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColumnConfigManager.prototype, "value", {
        /**
         * Returns the column filter value that is seen on tabl open.
         */
        get: function () {
            if (!(this.column === undefined || this.column.filter === undefined || this.column.filter.value === undefined)) {
                return this.column.filter.value;
            }
            return undefined;
        },
        enumerable: true,
        configurable: true
    });
    return ColumnConfigManager;
}());
exports.ColumnConfigManager = ColumnConfigManager;
