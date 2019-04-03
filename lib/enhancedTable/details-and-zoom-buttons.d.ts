/**
 * Creates and manages the details and and zoom buttons for all the rows of one panel instance.
 *
 * This class contains a custom angular controller to enable the opening of the details panel, and the zoom functionality.
 */
export declare class DetailsAndZoomButtons {
    constructor(panelManager: any);
    setDetailsAndZoomButtons(): void;
}
export interface DetailsAndZoomButtons {
    panelManager: any;
    mapApi: any;
    legendBlock: any;
    currentTableLayer: any;
    oidField: any;
}
