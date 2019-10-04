/**
 * Creates and manages one table config that corresponds to an enhancedTable.
 *
 * Used to establish default settings on table open as well as table behaviour.
 */
export declare class ConfigManager {
    constructor(baseLayer: any, panelManager: any);
    /**
     * Set up table for first time open.
     * Called upon ConfigManager creation which is called on table creation
     */
    tableInit(): void;
    /**
     * Returns table title as defined in config, or as the layer name if undefined in the config.
     */
    readonly title: string;
    /**
     * Maximizes table on open if maximized is set as true in the config.
     * Helper method to tableInit
     */
    maximize(): void;
    /**
     * Return whether global search is enabled/disabled according to config (default is enabled)
     */
    readonly globalSearchEnabled: boolean;
    /**
     * Return whether printing is enabled/disabled according to config (default is disabled)
     */
    readonly printEnabled: boolean;
    /**
     * Gets default search parameter for global search if defined in the config.
     */
    readonly defaultGlobalSearch: string;
    setDefaultGlobalSearchFilter(): void;
    /**
     * Return whether lazy filter is enabled for the table as defined in config, if undefined defaults to false.
     */
    readonly lazyFilterEnabled: boolean;
    /**
     * Return whether strict match is enabled when searching in the table as defined in config, if undefined defaults to false.
     */
    readonly searchStrictMatchEnabled: boolean;
    /**
     * Returns if the default filters are applied to the map. If undefined defaults to false
     */
    readonly applyMap: boolean;
    /**
     * Returns if the column filters are displayed on the table. If undefined default to true.
     */
    readonly showFilter: boolean;
    /**
     * Returns a list of column data defined in the config, so that the table can be initialized according to them.
     */
    readonly filteredAttributes: any[];
}
/**
 * Creates and manages one column node's config that corresponds to a table config that corresponds to an enhancedTable.
 * Note: one table config can have many column node config specifications
 * Used to establish default settings for columns on table open as well as column behaviour and floating filter behaviours.
 */
export declare class ColumnConfigManager {
    constructor(configManager: ConfigManager, column: any);
    /**
     * Initializes column width according to specifications in the config on table creation
     * If table needs to be filled up, disregards this width (respects table fill) ..i.e this is the minwidth
     */
    readonly width: any;
    /**
     * Initializes column sorts according to specifications in the config on table creation
     * If table needs to be filled up, disregards this width (respects table fill) ..i.e this is the minwidth
     */
    readonly sort: any;
    /**
     * Leaves out floating search bar from column if column is not searchable.
     * Set on table creation
     */
    readonly searchDisabled: boolean;
    /**
     * Returns if the type of filter is selector
     * Selector filter is initiated for when default data field types are string
     * Set up on table create
     */
    readonly isSelector: boolean;
    /**
     * Returns whether filter is static
     * Set up on table create
     */
    readonly isFilterStatic: boolean;
    /**
     * Returns the column filter value that is seen on tabl open.
     */
    readonly value: any;
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
