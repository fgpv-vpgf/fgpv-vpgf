import { Grid, GridOptions, ColDef, ColGroupDef, GridApi } from 'ag-grid/main';
import { PrintTable } from '../enhancedTable/print';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-balham.css';

export class EnhancedTable {
    constructor(mApi: any, element: HTMLElement, columns: (ColDef | ColGroupDef)[], rows: any[]) {
        this.mApi = mApi;
        this.printTable = new PrintTable(this);

        (<any>Object).assign(this.gridOptions, {
            columnDefs: columns,
            rowData: rows
        });

        new Grid(element, this.gridOptions);
        this.gApi = this.gridOptions.api;
    }

    init(mApi: any) {
        this.mApi = mApi;
    }

    print() {
        this.printTable.print();
    }

    updateRows(rows: any[]) {
        this.gApi.setRowData(rows);
    }
}

export interface EnhancedTable {
    gridOptions: GridOptions;
    mApi: any;
    gApi: GridApi;
    printTable: PrintTable;
}

EnhancedTable.prototype.gridOptions = {
    enableSorting: true,
    floatingFilter: true
};

class TableBuilder {
    private mApi: any;

    init(mApi: any) {
        this.mApi = mApi;
    }

    create(element: HTMLElement, columns: (ColDef | ColGroupDef)[], rows: any[]) {
        return new EnhancedTable(this.mApi, element, columns, rows);
    }
}

TableBuilder.prototype.id = 'fancyTable';

interface TableBuilder {
    id: string;
}

(<any>window).enhancedTable = TableBuilder;
