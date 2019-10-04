var CustomExport = /** @class */ (function () {
    function CustomExport() {
        this.feature = 'export';
    }
    CustomExport.prototype.preInit = function () {
        console.log('Sample export plugin pre-init check.');
    };
    CustomExport.prototype.init = function (api) {
        this.api = api;
        CustomExport.instances[this.api.id] = this;
    };
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
    CustomExport.prototype.generateExportStack = function (_a) {
        var legendBlocks = _a.legendBlocks, mapSize = _a.mapSize;
        var promises = [];
        // create a base image and colour it white
        var baseImage = RAMP.utils.createCanvas(mapSize.width, mapSize.height);
        var baseImageCtx = baseImage.getContext('2d');
        baseImageCtx.fillStyle = '#ffffff';
        baseImageCtx.fillRect(0, 0, baseImage.width, baseImage.height);
        // create underlying base canvas
        promises.push(Promise.resolve({
            graphic: baseImage
        }));
        //
        var mapImageSize = {
            width: mapSize.width * 0.8 - 20,
            height: mapSize.height - 20
        };
        var sourceX = (mapSize.width - mapImageSize.width) / 2;
        var sourceY = (mapSize.height - mapImageSize.height) / 2;
        // svg export graphic needs to be generated first because generating a server-side map image hides svg layers (unless using local printing)
        // TODO: prevent map generators from accepting export sizes
        var apiGenerators = this.api.exportGenerators;
        var pointsImage = apiGenerators.mapSVG().then(function (data) {
            var canvas = RAMP.utils.createCanvas(mapImageSize.width, mapImageSize.height);
            // crop the map image returned by the generator to fit into the layout
            // https://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/
            canvas
                .getContext('2d')
                .drawImage(data.graphic, sourceX, sourceY, mapImageSize.width, mapImageSize.height, 0, 0, mapImageSize.width, mapImageSize.height);
            return { graphic: canvas, offset: [10, 10] };
        });
        var mapImage = apiGenerators.mapImage({ backgroundColour: '#bfe8fe' }).then(function (data) {
            var canvas = RAMP.utils.createCanvas(mapImageSize.width, mapImageSize.height);
            // crop the map image returned by the generator to fit into the layout
            // https://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/
            canvas
                .getContext('2d')
                .drawImage(data.graphic, sourceX, sourceY, mapImageSize.width, mapImageSize.height, 0, 0, mapImageSize.width, mapImageSize.height);
            return { graphic: canvas, offset: [10, 10] };
        });
        var northArrowImage = apiGenerators.northArrow().then(function (data) { return ({
            graphic: data.graphic,
            offset: [40, 20]
        }); });
        var scaleBarImage = apiGenerators.scaleBar().then(function (data) { return ({
            graphic: data.graphic,
            offset: [mapImageSize.width - 10 - 120, mapImageSize.height - 50 - 10]
        }); });
        // we can pass in a modified copy of the legendBlocks if needed, in order to include/exclude certain layers from legend generation
        var legendImage = apiGenerators
            .legend({
            columnWidth: mapSize.width * 0.2 - 20 - 10,
            width: mapSize.width * 0.2 - 20 - 10,
            height: mapImageSize.height,
            legendBlocks: legendBlocks
        })
            .then(function (data) { return ({
            graphic: data.graphic,
            offset: [mapImageSize.width + 30, 10]
        }); });
        var titleImage = apiGenerators
            .htmlMarkup("<span style=\"font-size: 35px; padding: 8px 14px; display: block; text-align: center;\"><b>Interesting Fact</b> | <i>Atomic Engineering Lab</i> is out of \uD83C\uDF82</span>")
            .then(function (data) { return ({
            graphic: data.graphic,
            offset: [mapImageSize.width - 10 - data.graphic.width, 10 + 20]
        }); });
        promises.push(mapImage, pointsImage, northArrowImage, scaleBarImage, legendImage, titleImage);
        return promises;
    };
    // A store of the instances of areasOfInterest, 1 per map
    CustomExport.instances = {};
    return CustomExport;
}());
CustomExport.prototype.translations = {
    'en-CA': {
        title: 'Cake Export'
    },
    'fr-CA': {
        title: "Export la Cake"
    }
};
window.customExport = CustomExport;
