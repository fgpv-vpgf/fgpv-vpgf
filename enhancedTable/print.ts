import { GridApi } from "ag-grid/main";
import { EnhancedTable } from '../enhancedTable/index';

export class PrintTable {
    constructor(eTbl: EnhancedTable) {
        this.eTbl = eTbl;
    }

    print() {
        print();
    }    
}

export interface PrintTable {
    eTbl: EnhancedTable;
}