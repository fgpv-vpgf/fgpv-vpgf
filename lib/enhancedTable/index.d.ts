import { GridOptions, GridApi } from 'ag-grid-community';
import { PanelManager } from './panel-manager';
import { ConfigManager } from './config-manager';
export default class TableBuilder {
    feature: string;
    attributeHeaders: any;
    init(mapApi: any): void;
    openTable(baseLayer: any): void;
    createTable(attrBundle: AttrBundle): void;
}
interface AttrBundle {
    attributes: any[];
    layer: any;
}
export default interface TableBuilder {
    feature: string;
    id: string;
    mapApi: any;
    tableOptions: GridOptions;
    tableApi: GridApi;
    panel: PanelManager;
    translations: any;
    configManager: ConfigManager;
    legendBlock: any;
}
export {};
