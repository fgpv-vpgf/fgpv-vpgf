import { GridOptions, GridApi } from 'ag-grid-community';
import { PanelManager } from './panel-manager';
import { ConfigManager } from './config-manager';
import { PanelLoader } from './panel-loader';
export default class TableBuilder {
    feature: string;
    attributeHeaders: any;
    init(mapApi: any): void;
    findMatchingLayer(legendBlock: any): void;
    openTable(baseLayer: any): void;
    deleteLoaderPanel(): void;
    createTable(attrBundle: AttrBundle): void;
    reloadTable(baseLayer: any): void;
}
interface AttrBundle {
    attributes: any[];
    layer: any;
}
export default interface TableBuilder {
    feature: string;
    id: string;
    _name: string;
    mapApi: any;
    tableOptions: GridOptions;
    tableApi: GridApi;
    panelManager: PanelManager;
    translations: any;
    configManager: ConfigManager;
    legendBlock: any;
    loadingPanel: PanelLoader;
    loadingTimeout: any;
    layerAdded: any;
}
export {};
