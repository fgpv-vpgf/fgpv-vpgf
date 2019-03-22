import { PanelRowsManager } from './panel-rows-manager';
import { PanelStatusManager } from './panel-status-manager';
import { PanelStateManager } from './panel-state-manager';
/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
export declare class PanelManager {
    constructor(mapApi: any);
    setLegendBlock(block: any): void;
    open(tableOptions: any, layer: any): void;
    close(): void;
    onBtnExport(): void;
    onBtnPrint(): void;
    createHTMLTable(): string;
    setSize(): void;
    isMobile(): boolean;
    /**
     * Auto size all columns but check the max width
     * Note: Need a custom function here since setting maxWidth prevents
     *       `sizeColumnsToFit()` from filling the entire panel width
    */
    autoSizeToMaxWidth(columns?: Array<any>): void;
    /**
     * Check if columns don't take up entire grid width. If not size the columns to fit.
     */
    sizeColumnsToFitIfNeeded(): void;
    readonly id: string;
    makeHeader(): void;
    angularHeader(): void;
    compileTemplate(template: any): JQuery<HTMLElement>;
}
export interface PanelManager {
    panel: any;
    mapApi: any;
    _id: string;
    currentTableLayer: any;
    maximized: boolean;
    tableOptions: any;
    legendBlock: any;
    panelRowsManager: PanelRowsManager;
    panelStatusManager: PanelStatusManager;
    lastFilter: HTMLElement;
    gridBody: HTMLElement;
    configManager: any;
    mobileMenuScope: MobileMenuScope;
    recordCountScope: RecordCountScope;
    panelStateManager: PanelStateManager;
    searchText: string;
    filterByExtent: boolean;
    filtersChanged: boolean;
    hiddenColumns: any;
    columnMenuCtrl: any;
    notVisible: any;
    clearGlobalSearch: Function;
    reload: Function;
    toastInterval: any;
    showToast: Function;
}
interface MobileMenuScope {
    visible: boolean;
    searchEnabled: boolean;
    sizeDisabled: boolean;
}
interface RecordCountScope {
    scrollRecords: string;
    filterRecords: string;
}
export {};
