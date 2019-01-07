import { CUSTOM_HEADER_TEMPLATE } from "./templates";

/**
 * Custom Header for the enhanced table
 * Includes accessible header button for sorting and accessible buttons for column movement
 */
export class CustomHeader {

    init(agParams: any) {
        this.agParams = agParams;
        this.mapApi = this.agParams.mapApi;
        this.eGui = $(CUSTOM_HEADER_TEMPLATE(this.agParams.displayName))[0];
        this.scope = this.mapApi.$compile(this.eGui);
        this.onSortChanged();
        this.onColumnReorder();

        // get header buttons
        this.headerButton = this.eGui.querySelector('.custom-header-label');
        this.moveLeftButton = this.eGui.querySelector('.move-left');
        this.moveRightButton = this.eGui.querySelector('.move-right');

        // progress sort on header title click
        this.headerButton.addEventListener('click', (event) => {
            this.agParams.progressSort(event.shiftKey);
        });

        // move column left or right on button click
        let moveLeftListener = this.moveLeft.bind(this);
        let moveRightListener = this.moveRight.bind(this);
        this.moveLeftButton.addEventListener('click', moveLeftListener);
        this.moveRightButton.addEventListener('click', moveRightListener);

        // set indicator arrow visibility on sort change
        let onSortChangedListener = this.onSortChanged.bind(this);
        this.agParams.column.addEventListener('sortChanged', onSortChangedListener);
        // disable first column going left or last column going right
        let onColumnReorderListener = this.onColumnReorder.bind(this);
        this.agParams.column.addEventListener('leftChanged', onColumnReorderListener);
    }

    getGui(): HTMLElement {
        return this.eGui;
    }

    destroy(): void {
        let moveLeftListener = this.moveLeft.bind(this);
        let moveRightListener = this.moveRight.bind(this);
        let onSortChangedListener = this.onSortChanged.bind(this);
        let onColumnReorderListener = this.onColumnReorder.bind(this);

        this.headerButton.removeEventListener('click', (event) => {
            this.agParams.progressSort(event.shiftKey);
        });
        this.moveLeftButton.removeEventListener('click', moveLeftListener);
        this.moveRightButton.removeEventListener('click', moveRightListener);
        this.agParams.column.removeEventListener('sortChanged', onSortChangedListener);
        this.agParams.column.removeEventListener('leftChanged', onColumnReorderListener);
    }

    /** Update sort indicator visibility */
    onSortChanged() {
        this.scope.sortAsc = this.agParams.column.isSortAscending();
        this.scope.sortDesc = this.agParams.column.isSortDescending();
    }

    /** Disable button if column is at an end */
    onColumnReorder() {
        const columns = this.agParams.columnApi.getAllDisplayedColumns();
        const index = columns.indexOf(this.agParams.column);
        this.scope.min = index === 3; // 3 since icon and zoom/details columns are left most
        this.scope.max = index === columns.length - 1;
    }

    /** Move column 1 position left */
    moveLeft() {
        const columns = this.agParams.columnApi.getAllDisplayedColumns();
        const allColumns = this.agParams.columnApi.getAllGridColumns();
        const index = allColumns.indexOf(columns[columns.indexOf(this.agParams.column) - 1]);
        this.agParams.columnApi.moveColumn(this.agParams.column, index);
    }

    /** Move column 1 position right */
    moveRight() {
        const columns = this.agParams.columnApi.getAllDisplayedColumns();
        const allColumns = this.agParams.columnApi.getAllGridColumns();
        const index = allColumns.indexOf(columns[columns.indexOf(this.agParams.column) + 1]);
        this.agParams.columnApi.moveColumn(this.agParams.column, index);
    }
}

export interface CustomHeader {
    mapApi: any;
    agParams: any;
    eGui: HTMLElement;
    scope: any;
    headerButton: HTMLElement;
    moveLeftButton: HTMLElement;
    moveRightButton: HTMLElement;
}
