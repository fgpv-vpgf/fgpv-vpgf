/**
 * Creates and manages one table config that corresponds to an enhancedTable.
 *
 * Used to establish default settings on table open as well as table behaviour.
 */
export class ConfigManager {

    constructor(baseLayer: any, panelManager: any) {

        //init ConfigManager properties
        this.baseLayer = baseLayer;
        this.panelManager = panelManager;
        this.attributeHeaders = baseLayer.attributeHeaders;
        this.attributeArray = baseLayer._attributeArray;
        this.columnConfigs = {};
        const layerEntries = this.baseLayer._viewerLayer._childTree;

        if (this.baseLayer.table.title !== this.panelManager.legendBlock.name &&
            layerEntries !== undefined) {
            // if these titles are not the same, and the baseLayer has layer entries
            // look for the layer entry with the matching name and set ITS table config as the table config
            let that = this;
            layerEntries.forEach(entry => {
                if (entry.proxyWrapper !== undefined && entry.proxyWrapper.name === this.panelManager.legendBlock.name) {
                    this.tableConfig = entry.proxyWrapper.layerConfig.source.table !== undefined ?
                        entry.proxyWrapper.layerConfig.source.table : that.baseLayer.table;
                } else {
                    this.tableConfig = that.baseLayer.table;
                }
            });
        } else {
            this.tableConfig = baseLayer.table;
        }

        this.searchEnabled = this.tableConfig.search && this.tableConfig.search.enabled;
        this.tableInit();
    }

    /**
     * Set up table for first time open.
     * Called upon ConfigManager creation which is called on table creation
     */
    tableInit(): void {
        this.maximize();

        // populate array of column configs
        if (this.tableConfig.columns) {
            this.tableConfig.columns.forEach(column => {
                this.columnConfigs[column.data] = new ColumnConfigManager(this, column);
            });
        }
    }

    /**
     * Returns table title as defined in config, or as the layer name if undefined in the config.
     */
    get title(): string {
        return this.tableConfig.title || this.panelManager.legendBlock.name;
    }

    /**
     * Maximizes table on open if maximized is set as true in the config.
     * Helper method to tableInit
     */
    maximize(): void {
        const maximized = this.panelManager.panelStateManager.maximized;
        this.panelManager.maximized = maximized;
        this.panelManager.setSize();
    }

    /**
     * Return whether global search is enabled/disabled according to config (default is enabled)
     */
    get globalSearchEnabled(): boolean {
        return (this.searchEnabled !== undefined) ? this.searchEnabled : true;
    }

    /**
     * Return whether printing is enabled/disabled according to config (default is disabled)
     */
    get printEnabled(): boolean {
        return this.tableConfig.printEnabled !== undefined ? this.tableConfig.printEnabled : false;
    }

    /**
     * Gets default search parameter for global search if defined in the config.
     */
    get defaultGlobalSearch(): string {
        const searchText = this.tableConfig.search === undefined || this.tableConfig.search.value === undefined ? '' : this.tableConfig.search.value;
        return searchText;
    }

    setDefaultGlobalSearchFilter(): void {
        if (this.globalSearchEnabled) {
            this.panelManager.tableOptions.api.setQuickFilter(this.defaultGlobalSearch);
        }
    }

    /**
     * Return whether lazy filter is enabled for the table as defined in config, if undefined defaults to false.
     */
    get lazyFilterEnabled(): boolean {
        return (this.tableConfig.lazyFilter !== undefined) ? this.tableConfig.lazyFilter : false;
    }

    /**
     * Return whether strict match is enabled when searching in the table as defined in config, if undefined defaults to false.
     */
    get searchStrictMatchEnabled(): boolean {
        return (this.tableConfig.searchStrictMatch !== undefined) ? this.tableConfig.searchStrictMatch : false;
    }

    /**
     * Returns if the default filters are applied to the map. If undefined defaults to false
     */
    get applyMap(): boolean {
        return (this.tableConfig.applyMap !== undefined) ? this.tableConfig.applyMap : false;
    }

    /**
     * Returns if the column filters are displayed on the table. If undefined default to true.
     */
    get showFilter(): boolean {
        return (this.tableConfig.showFilter !== undefined) ? this.tableConfig.showFilter : true;
    }

    /**
     * Returns a list of column data defined in the config, so that the table can be initialized according to them.
     */
    get filteredAttributes(): any[] {
        let filteredAttributes = [];
        if (this.tableConfig.columns !== undefined) {
            this.tableConfig.columns.forEach(column => {
                filteredAttributes.push(column.data)
            });
        }
        return filteredAttributes;
    }
}

/**
 * Creates and manages one column node's config that corresponds to a table config that corresponds to an enhancedTable.
 * Note: one table config can have many column node config specifications
 * Used to establish default settings for columns on table open as well as column behaviour and floating filter behaviours.
 */
export class ColumnConfigManager {
    constructor(configManager: ConfigManager, column: any) {
        this.configManager = configManager;
        this.column = column;
    }

    /**
     * Initializes column width according to specifications in the config on table creation
     * If table needs to be filled up, disregards this width (respects table fill) ..i.e this is the minwidth
     */
    get width(): any {
        return (this.column !== undefined) ? this.column.width : undefined;
    }

    /**
     * Initializes column sorts according to specifications in the config on table creation
     * If table needs to be filled up, disregards this width (respects table fill) ..i.e this is the minwidth
     */
    get sort(): any {
        return (this.column !== undefined) ? this.column.sort : undefined;
    }

    /**
     * Leaves out floating search bar from column if column is not searchable.
     * Set on table creation
     */
    get searchDisabled(): boolean {
        if (this.column == undefined || this.column.searchable === undefined) {
            return false;
        }
        return !this.column.searchable;
    }

    /**
     * Returns if the type of filter is selector
     * Selector filter is initiated for when default data field types are string
     * Set up on table create
     */
    get isSelector(): boolean {
        // make comment indicating that that part of the config is ignored entirely if not selector and if default not string
        if (!(this.column === undefined || this.column.filter === undefined || this.column.filter.type === undefined)) {
            return this.column.filter.type === 'selector';
        }
        return false;
    }

    /**
     * Returns whether filter is static
     * Set up on table create
     */
    get isFilterStatic(): boolean {
        if (!(this.column === undefined || this.column.filter === undefined || this.column.filter.static === undefined)) {
            return this.column.filter.static;
        }
        return false;
    }

    /**
     * Returns the column filter value that is seen on tabl open.
     */
    get value(): any {
        if (!(this.column === undefined || this.column.filter === undefined || this.column.filter.value === undefined)) {
            return this.column.filter.value;
        }
        return undefined;
    }
}

export interface ConfigManager {
    baseLayer: any;
    attributeHeaders: any;
    attributeArray: [any];
    tableConfig: any;
    columnConfigs: any;
    panelManager: any;
    searchEnabled: boolean;
    printEnabled: boolean;
}


export interface ColumnConfigManager {
    column: any;
    configManager: ConfigManager;
}
