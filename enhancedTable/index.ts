import { GridOptions, GridApi } from 'ag-grid/main';
import { take } from 'rxjs/internal/operators/take';
import { PanelManager } from './panel-manager';

class TableBuilder {
    init(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = new PanelManager(mapApi);

        this.mapApi.layers.click.subscribe(baseLayer => {
            const attrs = baseLayer.getAttributes();

            if (attrs.length === 0) {
                this.mapApi.layers.attributesAdded.pipe(take(1)).subscribe(attrs => {
                    this.createTable(attrs);
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
        const cols = Object.keys(attrBundle.attributes[0]).map(columnName => ({
            headerName: columnName,
            field: columnName
        }));

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
        menu: {
            split: 'Split View',
            max: 'Maximize',
            print: 'Print',
            export: 'Export',
            filter: {
                extent: 'Filter by extent'
            }
        }
    },
    'fr-CA': {
        search: {
            placeholder: 'Texte à rechercher'
        },
        menu: {
            split: 'Diviser la vue',
            max: 'Agrandir',
            print: 'Imprimer',
            export: 'Exporter',
            filter: {
                extent: 'Filtrer par étendue'
            }
        }
    }
};

(<any>window).enhancedTable = TableBuilder;
