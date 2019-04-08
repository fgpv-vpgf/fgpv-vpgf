/**
 * Creates and manages one api panel instance to display the loading indicator before the `enhancedTable` is loaded.
 */
export declare class PanelLoader {
    constructor(mapApi: any, legendBlock: any);
    setSize(maximized: any): void;
    prepareHeader(): void;
    open(): void;
    prepareBody(): void;
    close(): void;
}
export interface PanelLoader {
    mapApi: any;
    panel: any;
    hidden: boolean;
    legendBlock: any;
}
