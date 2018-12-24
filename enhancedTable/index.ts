import { GridOptions, GridApi } from 'ag-grid-community';
import { take } from 'rxjs/internal/operators/take';
import { PanelManager } from './panel-manager';
import { DETAILS_AND_ZOOM } from './templates';
import { NumberFloatingFilter, DateFloatingFilter } from './custom-floating-filters';
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
                        this.createTable(attrs);
                    }
                });
            } else {
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
                let colDef: ColumnDefinition = {
                    headerName: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                    headerTooltip: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                    field: columnName,
                    filter: 'agTextColumnFilter',
                    floatingFilterComponentParams: { suppressFilterButton: true, mapApi: this.mapApi },
                    suppressSorting: false,
                    suppressFilter: false,
                };

                const fieldInfo = a.fields.find(field => field.name === columnName)
                if (fieldInfo) {
                    if (NUMBER_TYPES.indexOf(fieldInfo.type) > -1) {
                        //Column should filter numbers properly
                        colDef.filter = 'agNumberColumnFilter';
                        colDef.filterParams = {
                            inRangeInclusive: true
                        };
                        colDef.floatingFilterComponent = NumberFloatingFilter;
                    } else if (fieldInfo.type === DATE_TYPE) {
                        colDef.minWidth = 423;
                        // Column should render and filter date properly
                        colDef.filter = 'agDateColumnFilter';
                        colDef.filterParams = {
                            comparator: function (filterDate, entryDate) {
                                let entry = new Date(entryDate);
                                if (entry > filterDate) {
                                    return 1;
                                } else if (entry < filterDate) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            }
                        };
                        colDef.floatingFilterComponent = DateFloatingFilter;
                        colDef.cellRenderer = function (cell) {
                            let element = document.createElement('span');
                            element.innerHTML = getDateString(cell.value);
                            return element;
                        }
                        colDef.getQuickFilterText = function (params) {
                            return getDateString(params.value);
                        }
                    } else if (fieldInfo.type === TEXT_TYPE && attrBundle.layer.table !== undefined && !attrBundle.layer.table.lazyFilter) {
                        // Default to "regex" filtering for text columns
                        colDef.filterParams = {
                            textCustomComparator: function (filter, value, filterText) {
                                const re = new RegExp(`^${filterText.replace(/\*/, '.*')}`);
                                return re.test(value);
                            }
                        };
                    }

                    // set header compoenent
                    colDef.headerComponent = CustomHeader;
                    colDef.headerComponentParams = {
                        mapApi: this.mapApi
                    }
                }
                if (columnName === 'rvSymbol') {
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
                    colDef.suppressSorting = true;
                    colDef.suppressFilter = true;
                    colDef.maxWidth = 100;
                    cols.splice(0, 0, colDef);
                } else {
                    cols.push(colDef);
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

function getDateString(value) {
    const date = new Date(value)
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    return date.toLocaleDateString('en-CA', options);
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
}

interface ColumnDefinition {
    headerName: string;
    headerTooltip: string;
    minWidth?: number;
    maxWidth?: number;
    field: string;
    headerComponent?: {new(): CustomHeader};
    headerComponentParams?: HeaderComponentParams;
    filter: string;
    filterParams?: any;
    floatingFilterComponent?: {new(): NumberFloatingFilter|DateFloatingFilter};
    floatingFilterComponentParams: FloatingFilterComponentParams;
    cellRenderer?: (cellParams: any) => string|Element;
    suppressSorting: boolean;
    suppressFilter: boolean;
    getQuickFilterText?: (cellParams: any) => string;
}

interface HeaderComponentParams {
    mapApi: any;
}

interface FloatingFilterComponentParams {
    suppressFilterButton: boolean;
    mapApi: any;
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
