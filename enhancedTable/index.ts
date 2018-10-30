import { GridOptions, GridApi } from 'ag-grid-community';
import { take } from 'rxjs/internal/operators/take';
import { PanelManager } from './panel-manager';

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
    }

    createTable(attrBundle: AttrBundle) {
        let cols: Array<any> = [];
        let firstColPopulated: boolean = false;

        Object.keys(attrBundle.attributes[0]).forEach(columnName => {
            if (columnName !== 'rvSymbol' && columnName !== 'rvInteractive') {
                if (!firstColPopulated) {
                    firstColPopulated = true;
                    //the first column will have a default sort indicator
                    cols.push({
                        headerName: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                        headerTooltip: this.attributeHeaders[columnName]
                            ? this.attributeHeaders[columnName]['name']
                            : '',
                        field: columnName,
                        sort: 'asc'
                    });
                } else {
                    cols.push({
                        headerName: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                        headerTooltip: this.attributeHeaders[columnName]
                            ? this.attributeHeaders[columnName]['name']
                            : '',
                        field: columnName
                    });
                }
            } else if (columnName === 'rvSymbol') {
                cols = [
                    {
                        headerName: '',
                        headerTooltip: '',
                        field: columnName,
                        cellRenderer: function(cellImg) {
                            return cellImg.value;
                        },
                        suppressSorting: true,
                        suppressFilter: true
                    },
                    ...cols
                ];
            } else {
                cols = [
                    {
                        headerName: '',
                        headerTooltip: '',
                        field: columnName,
                        suppressSorting: true,
                        suppressFilter: true
                    },
                    ...cols
                ];
            }
        });

        (<any>Object).assign(this.tableOptions, {
            columnDefs: cols,
            rowData: attrBundle.attributes
        });

        this.panel.open(this.tableOptions, attrBundle.layer);
        this.tableApi = this.tableOptions.api;
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
}

TableBuilder.prototype.tableOptions = {
    enableSorting: true,
    floatingFilter: true
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
            hideColumns: 'Hide columns' // TODO: Add French translation
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
        }
    }
};

(<any>window).enhancedTable = TableBuilder;
