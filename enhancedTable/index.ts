import { GridOptions, GridApi } from 'ag-grid-community';
import { take } from 'rxjs/internal/operators/take';
import { PanelManager } from './panel-manager';
import { DETAILS_AND_ZOOM } from './templates';
import { ConfigManager, ColumnConfigManager } from './config-manager';
import {
    setUpDateFilter, setUpNumberFilter, setUpTextFilter
} from './custom-floating-filters';
import { CustomHeader } from './custom-header';

const NUMBER_TYPES = ["esriFieldTypeOID", "esriFieldTypeDouble", "esriFieldTypeInteger"];
const DATE_TYPE = "esriFieldTypeDate";
const TEXT_TYPE = "esriFieldTypeString";

class TableBuilder {
    intention = 'table';
    attributeHeaders: any;

    init(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = new PanelManager(mapApi);

        this.mapApi.layers.click.subscribe(baseLayer => {
            const attrs = baseLayer.getAttributes();
            this.attributeHeaders = baseLayer.attributeHeaders;
            if (attrs.length === 0) {
                // make sure all attributes are added before creating the table (otherwise table displays without SVGs)
                this.mapApi.layers.attributesAdded.pipe(take(1)).subscribe(attrs => {
                    if (
                        attrs.attributes[0] &&
                        attrs.attributes[0]['rvSymbol'] !== undefined &&
                        attrs.attributes[0]['rvInteractive'] !== undefined
                    ) {
                        this.configManager = new ConfigManager(baseLayer, this.panel);
                        this.panel.configManager = this.configManager;
                        this.createTable(attrs);
                    }
                });
            } else {
                this.configManager = new ConfigManager(baseLayer, this.panel);
                this.panel.configManager = this.configManager;
                this.createTable({
                    attributes: attrs,
                    layer: baseLayer
                });
            }
        });

        // toggle the enhancedTable if toggleDataTable is called from Legend API
        this.mapApi.ui.configLegend._legendStructure._root._tableToggled.subscribe(legendBlock => {
            if (legendBlock.blockType === 'node') {
                // make sure the item clicked is a node, and not group or other
                let layer;
                if (legendBlock.parentLayerType === 'esriDynamic') {
                    layer = this.mapApi.layers.allLayers.find(function (l) {
                        return l.id === legendBlock.layerRecordId && l.layerIndex === parseInt(legendBlock.itemIndex);
                    });
                } else {
                    layer = this.mapApi.layers.getLayersById(legendBlock.layerRecordId)[0];
                }
                if (layer) {
                    this.mapApi.layers._click.next(layer);
                }
            }
        });
    }

    createTable(attrBundle: AttrBundle) {
        const panel = this.panel.panel;
        let cols: Array<any> = [];

        attrBundle.layer._layerProxy.formattedAttributes.then(a => {
            Object.keys(attrBundle.attributes[0]).forEach(columnName => {

                if (columnName === 'rvSymbol' ||
                    columnName === 'rvInteractive' ||
                    this.configManager.filteredAttributes.length === 0 ||
                    this.configManager.filteredAttributes.indexOf(columnName) > -1) {
                    // only create column if it is valid according to config, or a symbol/interactive column

                    // set up the column according to the specifications from ColumnConfigManger
                    const column = new ColumnConfigManager(this.configManager, columnName);

                    let colDef: ColumnDefinition = {
                        width: column.width || 100,
                        minWidth: column.width,
                        headerName: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                        headerTooltip: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                        field: columnName,
                        filterParams: <FilterParameters>{},
                        filter: 'agTextColumnFilter',
                        floatingFilterComponentParams: { suppressFilterButton: true, mapApi: this.mapApi },
                        floatingFilterComponent: undefined,
                        suppressSorting: false,
                        suppressFilter: column.searchDisabled,
                        sort: column.sort,
                        visibility: column.column ? column.column.visible : undefined
                    };

                    // set up floating filters and column header
                    const fieldInfo = a.fields.find(field => field.name === columnName)
                    if (fieldInfo) {
                        const isSelector = column.isSelector;
                        const isStatic = column.isFilterStatic;

                        if (!column.searchDisabled || column.searchDisabled === undefined) {
                            // only set up floating filters if search isn't disabled
                            // floating filters of type number, date, text
                            // text can be of type text or selector
                            if (NUMBER_TYPES.indexOf(fieldInfo.type) > -1) {
                                setUpNumberFilter(colDef, isStatic, column.value, this.tableOptions);
                            } else if (fieldInfo.type === DATE_TYPE) {
                                setUpDateFilter(colDef, isStatic, this.mapApi);
                            } else if (fieldInfo.type === TEXT_TYPE && attrBundle.layer.table !== undefined) {
                                setUpTextFilter(colDef, isStatic, isSelector, this.configManager.lazyFilterEnabled, this.configManager.searchStrictMatchEnabled, column.value);
                            }
                        }

                        // only set up header component if column is visible
                        // TODO: have a way to set up header component properly if column is not visible
                        if (colDef.visibility === true || colDef.visibility === undefined) {
                            setUpHeaderComponent(colDef, this.mapApi);
                        } else {
                            let map = this.mapApi;
                            colDef.setHeaderComponent = function (colDef, map) { setUpHeaderComponent(colDef, map) };
                        }
                    }

                    // symbols and interactive columns are set up for every table
                    setUpSymbolsAndInteractive(columnName, colDef, cols, panel);
                }

            });
            (<any>Object).assign(this.tableOptions, {
                columnDefs: cols,
                rowData: attrBundle.attributes
            });

            this.panel.open(this.tableOptions, attrBundle.layer);
            this.tableApi = this.tableOptions.api;
        });
    }
}

/* Helper function to set up symbols and interactive columns*/
function setUpSymbolsAndInteractive(columnName: string, colDef: any, cols: any, panel: any) {
    if (columnName === 'rvSymbol') {
        // set svg symbol for the symbol column
        colDef.cellRenderer = function (cellImg) {
            return cellImg.value;
        };
    } else if (columnName === 'rvInteractive') {
        // sets details and zoom buttons for the row
        colDef.cellRenderer = function (cellImg) {
            return new panel.container(DETAILS_AND_ZOOM(cellImg.rowIndex)).elementAttr[0];
        }
    }

    if (columnName === 'rvSymbol' || columnName === 'rvInteractive') {
        // symbols and interactive columns don't have options for sort, filter and have default widths
        colDef.suppressSorting = true;
        colDef.suppressFilter = true;
        colDef.maxWidth = 100;
        cols.splice(0, 0, colDef);
    } else {
        cols.push(colDef);
    }
}

/*Helper function to set up column headers*/
function setUpHeaderComponent(colDef, mApi) {
    colDef.headerComponent = CustomHeader;
    colDef.headerComponentParams = {
        mapApi: mApi
    }
}

interface AttrBundle {
    attributes: any[];
    layer: any;
}

interface TableBuilder {
    intention: string;
    id: string;
    mapApi: any;
    tableOptions: GridOptions;
    tableApi: GridApi;
    panel: PanelManager;
    translations: any;
    configManager: ConfigManager;
}

interface ColumnDefinition {
    headerName: string;
    headerTooltip: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    field: string;
    headerComponent?: { new(): CustomHeader };
    headerComponentParams?: HeaderComponentParams;
    filter: string;
    filterParams?: any;
    floatingFilterComponent?: undefined;
    floatingFilterComponentParams: FloatingFilterComponentParams;
    cellRenderer?: (cellParams: any) => string | Element;
    suppressSorting: boolean;
    suppressFilter: boolean;
    getQuickFilterText?: (cellParams: any) => string;
    sort?: any;
    visibility?: any;
    setHeaderComponent?: any;
}

interface HeaderComponentParams {
    mapApi: any;
}

interface FloatingFilterComponentParams {
    suppressFilterButton: boolean;
    mapApi: any;
}

interface FilterParameters {
    inRangeInclusive?: boolean;
    comparator?: Function;
    textCustomComparator?: Function;
    textFormatter?: Function;
}

TableBuilder.prototype.tableOptions = {
    enableSorting: true,
    floatingFilter: true,
    autoSizePadding: 75,
    suppressColumnVirtualisation: true,
    defaultColDef: {
        width: 100
    }
};

TableBuilder.prototype.id = 'fancyTable';

TableBuilder.prototype.translations = {
    'en-CA': {
        search: {
            placeholder: 'Search table'
        },
        table: {
            filter: {
                clear: 'Clear filters'
            },
            hideColumns: 'Hide columns'
        },
        menu: {
            split: 'Split View',
            max: 'Maximize',
            print: 'Print',
            export: 'Export',
            filter: {
                extent: 'Filter by extent',
                show: 'Show filters'
            }
        },
        detailsAndZoom: {
            details: 'Details',
            zoom: 'Zoom To Feature'
        }
    },
    'fr-CA': {
        search: {
            placeholder: 'Texte à rechercher'
        },
        table: {
            filter: {
                clear: 'Effacer les filtres'
            },
            hideColumns: 'Masquer les colonnes' // TODO: Add Official French translation
        },
        menu: {
            split: 'Diviser la vue',
            max: 'Agrandir',
            print: 'Imprimer',
            export: 'Exporter',
            filter: {
                extent: 'Filtrer par étendue',
                show: 'Afficher les filtres'
            }
        },
        detailsAndZoom: {
            details: 'Détails',
            zoom: "Zoom à l'élément"
        }
    }
};

(<any>window).enhancedTable = TableBuilder;
