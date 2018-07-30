import { Grid, GridOptions, ColDef, ColGroupDef, GridApi } from 'ag-grid/main';
import { take } from 'rxjs/operators';
import 'jquery';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-balham.css';

class PanelManager {
    constructor(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = this.mapApi.createPanel(this.id);
        this.tableContent = $(`<div rv-focus-exempt></div>`);

        this.panel.panelContents.css({
            top: '0px',
            left: '410px',
            right: '0px',
            bottom: '0px'
        });

        this.panel.panelBody.addClass('ag-theme-balham');

        this.panel.controls = [new this.panel.button('X')];
        this.panel.content = new this.panel.container(this.tableContent);
    }

    open(tableOptions: any) {
        this.tableContent.empty();
        new Grid(this.tableContent[0], tableOptions);
        this.panel.open();
    }

    get id(): string {
        this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
        return this._id;
    }
}

interface PanelManager {
    panel: any;
    mapApi: any;
    tableContent: JQuery<HTMLElement>;
    _id: string;
}

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

        this.panel.open(this.tableOptions);
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
}

TableBuilder.prototype.tableOptions = {
    enableSorting: true,
    floatingFilter: true
};

TableBuilder.prototype.id = 'fancyTable';

(<any>window).enhancedTable = TableBuilder;
