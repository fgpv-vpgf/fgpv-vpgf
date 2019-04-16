/**
 * Custom Header for the enhanced table
 * Includes accessible header button for sorting and accessible buttons for column movement
 */
export declare class CustomHeader {
    init(agParams: any): void;
    getGui(): HTMLElement;
    destroy(): void;
    /** Update sort indicator visibility */
    onSortChanged(): void;
    /** Disable button if column is at an end */
    onColumnReorder(): void;
    /** Move column 1 position left */
    moveLeft(): void;
    /** Move column 1 position right */
    moveRight(): void;
    progressSort(event: any): void;
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
