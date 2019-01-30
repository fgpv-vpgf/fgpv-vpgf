/**
 * Function to ensure focused column filter is scrolled into view
 * @param element filter being focused
 * @param panel table panel with scrollbar
 */
export declare function scrollIntoView(element: any, panel: HTMLElement): void;
/**
 * Function to help enter and exit grid using the keyboard
 * @param element grid being focused
 * @param tableOptions provide access to table api
 * @param lastFilter final filter input before entering the grid
 */
export declare function tabToGrid(event: any, tableOptions: any, lastFilter: HTMLElement): void;
