declare var RAMP: {
    utils: {
        createCanvas: (width: number, height: number, backgroundColor?: string) => HTMLCanvasElement;
    };
};

interface ExportPluginOptions {
    legendBlocks: any;
    mapSize: { width: number; height: number };
}

class CustomExport {
    feature: string = 'export';

    // A store of the instances of areasOfInterest, 1 per map
    static instances: { [id: string]: CustomExport } = {};

    preInit() {
        console.log('Sample export plugin pre-init check.');
    }

    init(api: any) {
        this.api = api;

        CustomExport.instances[this.api.id] = this;
    }

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
    generateExportStack({ legendBlocks, mapSize }: ExportPluginOptions): Promise<HTMLCanvasElement>[] {
        const promises = [];

        // create a base image and colour it white
        const baseImage = RAMP.utils.createCanvas(mapSize.width, mapSize.height);
        const baseImageCtx = baseImage.getContext('2d');
        baseImageCtx.fillStyle = '#ffffff';
        baseImageCtx.fillRect(0, 0, baseImage.width, baseImage.height);

        // create underlying base canvas
        promises.push(
            Promise.resolve({
                graphic: baseImage
            })
        );

        //
        const mapImageSize = {
            width: mapSize.width * 0.8 - 20,
            height: mapSize.height - 20
        };

        const sourceX = (mapSize.width - mapImageSize.width) / 2;
        const sourceY = (mapSize.height - mapImageSize.height) / 2;

        // svg export graphic needs to be generated first because generating a server-side map image hides svg layers (unless using local printing)
        // TODO: prevent map generators from accepting export sizes
        const apiGenerators = this.api.exportGenerators;

        const pointsImage = apiGenerators.mapSVG().then(data => {
            const canvas = RAMP.utils.createCanvas(mapImageSize.width, mapImageSize.height);

            // crop the map image returned by the generator to fit into the layout
            // https://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/
            canvas
                .getContext('2d')
                .drawImage(
                    data.graphic,
                    sourceX,
                    sourceY,
                    mapImageSize.width,
                    mapImageSize.height,
                    0,
                    0,
                    mapImageSize.width,
                    mapImageSize.height
                );

            return { graphic: canvas, offset: [10, 10] };
        });
        const mapImage = apiGenerators.mapImage({ backgroundColour: '#bfe8fe' }).then(data => {
            const canvas = RAMP.utils.createCanvas(mapImageSize.width, mapImageSize.height);

            // crop the map image returned by the generator to fit into the layout
            // https://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/
            canvas
                .getContext('2d')
                .drawImage(
                    data.graphic,
                    sourceX,
                    sourceY,
                    mapImageSize.width,
                    mapImageSize.height,
                    0,
                    0,
                    mapImageSize.width,
                    mapImageSize.height
                );

            return { graphic: canvas, offset: [10, 10] };
        });

        const northArrowImage = apiGenerators.northArrow().then(data => ({
            graphic: data.graphic,
            offset: [40, 20]
        }));

        const scaleBarImage = apiGenerators.scaleBar().then(data => ({
            graphic: data.graphic,
            offset: [mapImageSize.width - 10 - 120, mapImageSize.height - 50 - 10]
        }));

        // we can pass in a modified copy of the legendBlocks if needed, in order to include/exclude certain layers from legend generation
        const legendImage = apiGenerators
            .legend({
                columnWidth: mapSize.width * 0.2 - 20 - 10,
                width: mapSize.width * 0.2 - 20 - 10,
                height: mapImageSize.height,
                legendBlocks
            })
            .then(data => ({
                graphic: data.graphic,
                offset: [mapImageSize.width + 30, 10]
            }));

        const titleImage = apiGenerators
            .htmlMarkup(
                `<span style="font-size: 35px; padding: 8px 14px; display: block; text-align: center;"><b>Interesting Fact</b> | <i>Atomic Engineering Lab</i> is out of 🎂</span>`
            )
            .then(data => ({
                graphic: data.graphic,
                offset: [mapImageSize.width - 10 - data.graphic.width, 10 + 20]
            }));

        promises.push(mapImage, pointsImage, northArrowImage, scaleBarImage, legendImage, titleImage);

        return promises;
    }
}

interface CustomExport {
    translations: any;
    config: any;
    api: any;
    _RV: any;
}

CustomExport.prototype.translations = {
    'en-CA': {
        title: 'Cake Export'
    },
    'fr-CA': {
        title: `Export la Cake`
    }
};

(<any>window).customExport = CustomExport;
