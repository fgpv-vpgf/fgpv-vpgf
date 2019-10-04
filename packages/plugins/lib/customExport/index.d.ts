declare var RAMP: {
    utils: {
        createCanvas: (width: number, height: number, backgroundColor?: string) => HTMLCanvasElement;
    };
};
interface ExportPluginOptions {
    legendBlocks: any;
    mapSize: {
        width: number;
        height: number;
    };
}
declare class CustomExport {
    feature: string;
    static instances: {
        [id: string]: CustomExport;
    };
    preInit(): void;
    init(api: any): void;
    /**
     * Creates a stack of export images and returns them to RAMP.
     *
     * An export plugin should return a collection of promises each resolving with with a graphic and its offset
     * { graphic: <canvas>, offset: [<left>, <top>] }[]
     * - the first graphic is considered to be the base graphic and its offset should be [0,0]
     * - all other graphics will be offset relative to the base graphic
     * - when all promises have resolved, export is considered to be generated
     * - if any of the promises fail, the export is considered to have failed and a standard error message will be displayed
     *
     * The plugin is free to rearrange `legendBlocks` as it sees fit as long as its structure remains valid.
     *
     * @param {ExportPluginOptions} { legendBlocks, mapSize } `legendBlocks` is a hierarchy of legend block representing the current legend; `mapSize` indicates the size of the map image visible on the screen
     * @returns {Promise<HTMLCanvasElement>[]}
     * @memberof CustomExport
     */
    generateExportStack({ legendBlocks, mapSize }: ExportPluginOptions): Promise<HTMLCanvasElement>[];
}
interface CustomExport {
    translations: any;
    config: any;
    api: any;
    _RV: any;
}
