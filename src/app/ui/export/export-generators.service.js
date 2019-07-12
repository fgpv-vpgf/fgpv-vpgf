import html2canvas from 'html2canvas';

const EXPORT_IMAGE_GUTTER = 20; // padding around the export image
const RETRY_LIMIT = 3;

/**
 * @module exportGenerators
 * @memberof app.ui
 * @requires dependencies
 * @description
 *
 * The `exportGenerators` contains generator functions for export components.
 * a generator function takes three parameters:
 *                          exportSize {ExportSize} - the currently selected map size
 *                          showToast {Function} - a function display a toast notification for the user
 *                          value {Object} [optional] - any value stored in the component
 *                          timeout {Number} [optional=0] - a delay before after which the generation is considered to have failed; 0 means no delay
 *                      generator function may optionally return a value object which will override the component's stored value object (this can be useful if generator updates the value and it needs to persist)
 *
 * Generator should handle errors and display error notifications using the `showToast` function.
 */
angular.module('app.ui').factory('exportGenerators', exportGenerators);

function exportGenerators(
    common,
    $q,
    $filter,
    $translate,
    configService,
    graphicsService,
    exportSizesService,
    exportLegendService,
    geoService,
    mapToolService,
    appInfo
) {
    const service = {
        titleGenerator,

        mapDummyGenerator,
        mapSVGGenerator,
        mapImageGenerator,

        legendGenerator,

        northarrowGenerator,
        scalebarGenerator,

        timestampGenerator,

        footnoteGenerator,

        customMarkupGenerator
    };

    return service;

    /**
     * A helper function to wrap the generator output.
     * @function wrapOutput
     * @private
     * @param {Promise} graphicPromise a promise resolving with the generator result
     * @param {Object} value [optional] value passed to the generator and modified by it to be stored in the export component
     * @return {Promise} generator output wrapped in a promise in the form of { graphic, value }
     */
    function wrapOutput(graphicPromise, value) {
        return graphicPromise.then(graphic => ({ graphic, value }));
    }

    // GENERATORS START
    /**
     * Generates the title of the export image.
     * @function titleGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function titleGenerator(showToast, value) {
        const exportSize = exportSizesService.selectedOption;

        // return empty graphic 0x0 if title text is not specified
        if (!angular.isString(value) || value === '') {
            return { graphic: graphicsService.createCanvas(0, 0) };
        }

        const titleText = value;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg();

        const titleSvg = containerSvg.textflow(titleText || '', exportSize.width - 20 * 2).attr({
            'font-family': 'Roboto',
            'font-weight': 'normal',
            'font-size': 35,
            anchor: 'start'
        });

        const textBox = titleSvg.bbox();
        containerSvg.size(textBox.width, Math.abs(textBox.y) + textBox.height);

        const titleGraphic = graphicsService.createCanvas(textBox.width, Math.abs(textBox.y) + textBox.height);
        const titlePromise = graphicsService.svgToCanvas(containerSvg, titleGraphic);

        return wrapOutput(titlePromise);
    }

    /**
     * Generates an empty canvas with the currently selected size. This is needed to prevent the export dialog from collapsing until the map images can be generated.
     *
     * @function mapDummyGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function mapDummyGenerator() {
        const exportSize = exportSizesService.selectedOption;

        const dummyGraphic = graphicsService.createCanvas();
        dummyGraphic.width = exportSize.width;
        dummyGraphic.height = exportSize.height;

        return { graphic: dummyGraphic };
    }

    /**
     * Generates an image of the svg-based layers.
     *
     * @function mapSVGGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function mapSVGGenerator() {
        const exportSize = exportSizesService.selectedOption;
        const svgGeneratorPromise = geoService.map.printLocal(exportSize);

        return wrapOutput(svgGeneratorPromise);
    }

    /**
     * Generates an image of the image-based layers.
     *
     * @function mapImageGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @param {Number} timeout [optional=0] - a delay before after which the generation is considered to have failed; 0 means no delay
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function mapImageGenerator(showToast, value, timeout = 0) {
        const exportSize = exportSizesService.selectedOption;

        const {
            map: { instance: mapInstance },
            services: {
                exportMapUrl,
                export: { cleanCanvas }
            }
        } = configService.getSync;

        let isGenerateCanceled = false; // the server print job was cancelled
        let hasOmittedImage = false; // the local printing has omitted tainted images
        let canvasIsTainted = false; // the local printing has tainted the canvas
        let timeoutHandle;

        // force `cleanCanvas` on IE11, since it's not possible to right-click-save-as the resulting export image in IE11
        // the clean canvas toggle tells the generator whether or not to omit tainted images, cleanCanvas = true iff omit tainted images
        const localGeneratorPromise = localGenerate(cleanCanvas || appInfo.isIE11);
        let serverGeneratorPromise;

        // If exportMapUrl is set, then start the server generation process
        if (exportMapUrl) {
            serverGeneratorPromise = serverGenerate();

            return localGeneratorPromise.then(() => {
                if (!hasOmittedImage && !canvasIsTainted) {
                    // if local generator comes back clean without omitting anything, return that
                    return wrapLocalOutput();
                } else {
                    // if local generator is tainted or had to skip something, check if the server returns properly
                    return serverGeneratorPromise.then(
                        // on success return server image
                        () => wrapOutput(serverGeneratorPromise),
                        // on error return local image
                        wrapLocalOutput
                    );
                }
            });
        } else {
            // no exportMapUrl set, only choice is to return local image
            return wrapLocalOutput();
        }

        /**
         * A helper function which returns the local generation output and display an user notification if any of the layer images
         * are excluded when `cleanCanvas` is set and image are non-CORS.
         *
         * @return {Object} a result object in the form of { graphic, value }
         *                  graphic {Canvas} - a resulting graphic
         *                  value {Object} - a modified value passed from the ExportComponent
         */
        function wrapLocalOutput() {
            const outputPromise = localGeneratorPromise.then(canvas => {
                // we only want to show this message if the local output is included in the final export image
                if (hasOmittedImage) {
                    showToast('error.image.tainted', { action: '', hideDelay: 5000 });
                }

                return canvas;
            });

            return wrapOutput(outputPromise);
        }

        function localGenerate(cleanCanvas) {
            const localPrintPromise = new Promise((resolve, reject) => {
                const mainCanvas = graphicsService.createCanvas(exportSize.width, exportSize.height);
                const ctx = mainCanvas.getContext('2d');

                const esriRoot = document.querySelector('.rv-esri-map').firstElementChild;
                const imagePromises = angular
                    .element(esriRoot)
                    .find('img:visible')
                    .toArray()
                    .filter(img => img.nodeName === 'IMG') // IE11 selects SVG Image elements even tough they have different nodeNames; filter them out
                    .map(img =>
                        graphicsService
                            .imageLoader(img.src, 10000)
                            .then(corsImg => ({
                                imgSource: img,
                                imgItem: corsImg,
                                error: false
                            }))
                            .catch(error => ({
                                imgSource: img,
                                imgItem: img,
                                error
                            }))
                    );

                // need to wait for all images to load, so they can be added to the canvas in the correct order
                Promise.all(imagePromises).then(data => {
                    // eslint-disable-next-line complexity
                    data.forEach(({ imgSource, imgItem, error }) => {
                        // image loading might error for other reasons than CORS - timeout, server connectivity, etc.
                        // if the image loading failed, check if the local copy of the image is tainted
                        // UPDATE: IE11 somehow manages to load non-cors images with 'anonymous' tag without errors, and this ends up tainting canvas after all
                        // always check if the loaded image is tainted
                        let imgTainted = graphicsService.isTainted(imgItem);

                        if (cleanCanvas && imgTainted) {
                            hasOmittedImage = true;
                            return;
                        } else if (imgTainted) {
                            canvasIsTainted = true;
                        }

                        const offset = getOffset(imgSource, esriRoot);
                        addToCanvas(imgItem, offset, imgSource.style.opacity || 1);
                    });

                    resolve(mainCanvas);
                });

                function addToCanvas(imgItem, offset, opacity = 1) {
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(imgItem, offset.left, offset.top);
                }

                function getOffset(element, container) {
                    const elementRect = element.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();

                    return {
                        top: elementRect.top - containerRect.top,
                        left: elementRect.left - containerRect.left
                    };
                }
            });

            return localPrintPromise;
        }

        function serverGenerate() {
            // create a promise and start generating the export map image
            const serverPrintPromise = $q((resolve, reject) => {
                serverPrint(exportMapUrl)
                    .then(data => resolve(data))
                    .catch(reject);

                // set up the timeout and cancel the export generation when it expires
                if (!timeout) {
                    return;
                }

                // console.log('generation timeout started', timeout);
                common.$timeout.cancel(timeoutHandle);
                timeoutHandle = common.$timeout(() => {
                    isGenerateCanceled = true;
                    // console.log('generation timed out');
                    reject({ timeout: true });
                }, timeout);
            });

            return serverPrintPromise;
        }

        function serverPrint(exportMapUrl, attempt = 0) {
            const serverPromise = mapInstance.printServer({
                url: exportMapUrl,
                format: 'png32',
                width: exportSize.width,
                height: exportSize.height
            });

            const wrapperPromise = $q((resolve, reject) => {
                $q.resolve(serverPromise)
                    .then(data => {
                        // timeout expiring should not have any effect after this point, but cancel anyway
                        common.$timeout.cancel(timeoutHandle);
                        resolve(data);
                    })
                    .catch(error => {
                        // stop; the promise has been rejected already
                        if (isGenerateCanceled) {
                            return;
                        }

                        attempt++;
                        console.error(
                            'exportGeneratorsService',
                            `print task failed on try ${attempt} with error`,
                            error
                        );

                        // print task with many layers will likely fail due to esri's proxy/cors issue https://github.com/fgpv-vpgf/fgpv-vpgf/issues/702
                        // submitting it a second time usually works; if not, submit a third time
                        if (attempt <= RETRY_LIMIT) {
                            console.log('exportGeneratorsService', `trying print task again`);
                            resolve(serverPrint(exportMapUrl, attempt));
                        } else {
                            // stop the timeout and ask the user if she wants to retry
                            common.$timeout.cancel(timeoutHandle);
                            showToast('error.service.timeout', { action: 'retry', hideDelay: 5000 }).then(response => {
                                if (response === 'ok') {
                                    // promise resolves with 'ok' when user clicks 'retry'
                                    console.log('exportGeneratorsService', `trying print task again`);
                                    // run the cycle again, starting the timeout anew
                                    resolve(serverGenerate());
                                } else {
                                    reject(error);
                                }
                            });
                        }
                    });
            });

            return wrapperPromise;
        }
    }

    /**
     * Generates the legend graphic.
     *
     * @function legendGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function legendGenerator(showToast, value = {}) {
        const exportSize = exportSizesService.selectedOption;

        // update `exportLegendService.generate` function to take ExportSize object as the first parameter
        let columnWidth;
        if (value.columnWidth) {
            columnWidth = value.columnWidth;
        } else if (configService.getSync.services.export && configService.getSync.services.export.legend) {
            columnWidth = configService.getSync.services.export.legend.columnWidth;
        }

        const legendPromise = exportLegendService.generate(
            value.height || exportSize.height,
            value.width || exportSize.width,
            columnWidth || 350,
            showToast
        );

        return wrapOutput(legendPromise);
    }

    /**
     * Generates scalebar graphic
     *
     * @function scalebarGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function scalebarGenerator() {
        const exportSize = exportSizesService.selectedOption;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg();
        const scalebarGroup = containerSvg.group();

        // get scale bar information (can specify output image size if not same as map size)
        // need to specify containerWidth because when we resize the container width may changed
        // if we don't do this, scale bar does not update when output is resized
        const scale = geoService.map.getScaleRatio(exportSize.width);

        // text attributes
        const attr = {
            'font-family': 'Roboto',
            'font-weight': 'normal',
            'font-size': 12,
            x: 0,
            y: 0,
            anchor: 'start'
        };

        // set label and pixel length for metric
        const metric = getScaleInfo(scale.ratio, scale.units[0]);
        scalebarGroup.text(metric.label).attr(attr);
        scalebarGroup.line(0, 22, metric.width, 22).stroke('black');

        // set label and pixel length for imperial
        const imperial = getScaleInfo(scale.ratio / 1.6, scale.units[1]);
        attr.y = 30;
        scalebarGroup.line(0, 29, imperial.width, 29).stroke('black');
        scalebarGroup.text(imperial.label).attr(attr);

        // calculate the box of the scalebar group
        const groupBbox = scalebarGroup.children().reduce((bbox, child) => bbox.merge(child.bbox()), new SVG.BBox());

        // size the container to its content
        containerSvg.size(groupBbox.width, groupBbox.height);

        const scalebarGraphic = graphicsService.createCanvas(groupBbox.width, groupBbox.height);
        const scalebarPromise = graphicsService.svgToCanvas(containerSvg, scalebarGraphic);

        return wrapOutput(scalebarPromise);

        /**
         * Get scale bar information to show on export map
         * @function getScaleInfo
         * @private
         * @param {Number} ratio the earth distance for 1 pixel
         * @param {String} unit the distance unit
         * @return {Object} info information for the scalebar
         *                          - label: label for the scalebar with unit
         *                          - width: width to apply to style the bar itself
         */
        function getScaleInfo(ratio, unit) {
            // find the first round distance that makes the scale bar less than 120 pixels
            const scaleRatio = 120 * ratio;

            // find modulo value to use
            const modulo = Math.pow(10, Math.floor(Math.log(scaleRatio) / Math.LN10) + 1 - 1);

            // get bar length
            const bar = scaleRatio - (scaleRatio % modulo);

            // return label and pixel bar length
            // add approx to warn user about using scale bar as a ruler (scalebar is always approximative)
            return {
                label: `${parseFloat(bar.toFixed(1)).toString()}${unit} ${$translate.instant('export.label.approx')}`,
                width: `${Math.floor((bar * 120) / scaleRatio)}`
            };
        }
    }

    /**
     * Generates north arrow graphic.
     *
     * @function northarrowGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function northarrowGenerator() {
        // TODO: move this into assets
        // jscs:disable maximumLineLength
        const arrowSCG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61.06 96.62"><g transform="translate(-1.438 30.744)"><g fill="none" stroke="#000"><path d="m61 35c0 16.02-12.984 29-29 29-16.02 0-29-12.984-29-29 0-16.02 12.984-29 29-29 16.02 0 29 12.984 29 29z" stroke-width="3"/><path d="m55 35c0 12.979-10.521 23.5-23.5 23.5-12.979 0-23.5-10.521-23.5-23.5 0-12.979 10.521-23.5 23.5-23.5 12.979 0 23.5 10.521 23.5 23.5z" transform="matrix(1.01148 0 0 .99988-.089.004)" stroke-width=".497"/><path d="m32 35v-32" stroke-width=".25"/></g><path d="m32-9.453l28.938 73.826-29-29-29 29z" fill="#fff" stroke="#fff" stroke-width="3"/><path d="m32-9.453l29 73.45-29-29-29 29z" fill="none" stroke="#000" stroke-linecap="square"/><text x="22.71" y="-10.854" font-family="OPEN SANS" word-spacing="0" line-height="125%" letter-spacing="0" font-size="40"><tspan x="22.71" y="-10.854" font-family="Adobe Heiti Std R" font-size="26">N</tspan></text></g><g transform="translate(0-3.829)" fill="none" stroke="#000" stroke-width=".25"><path d="m4 92.82l6.74-3.891"/><path d="m4.603 90.7l10.397-6"/><path d="m3 95.17l4-2.309"/><path d="m5.442 88.45l13.856-8"/><path d="m12 72.26l18.686-10.812"/><path d="m14.593 65.45l16.09-9.291"/><path d="m15.343 63.24l15.343-8.858"/><path d="m16.877 60.58l13.809-7.972"/><path d="m17.511 58.45l13.174-7.606"/><path d="m18.412 56.15l12.274-7.087"/><path d="m19 54.04l11.427-6.597"/><path d="m20 51.757l10.822-6.311"/><path d="m20.826 49.45l9.86-5.693"/><path d="m21.48 47.3l9.206-5.315"/><path d="m23 44.647l7.686-4.437"/><path d="m23.744 42.45l6.928-4"/><path d="m24.549 40.21l6.137-3.543"/><path d="m25 38.18l5.686-3.283"/><path d="m26.663 35.446l4.02-2.323"/><path d="m27.617 33.12l3.069-1.772"/><path d="m28 31.13l2.686-1.551"/><path d="m29.15 28.694l1.534-.886"/><path d="m13 69.909l17.686-10.211"/><path d="m9.206 79.19l21.48-12.402"/><path d="m8.36 81.45l22.326-12.89"/><path d="m7.671 83.62l19.946-11.516"/><path d="m6.137 86.27l17.02-9.827"/><path d="m10 76.956l20.686-11.943"/><path d="m11.279 74.45l19.407-11.205"/><path d="m14 67.56l16.686-9.634"/><path d="m30.562 65.744v-43.566" transform="translate(0 3.829)"/></g></svg>`;
        // jscs:enable maximumLineLength

        const rotation = mapToolService.northArrow().rotationAngle;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg();

        const arrowSvg = containerSvg
            .group()
            .svg(arrowSCG)
            .first();
        const arrowViewBox = arrowSvg.viewbox();
        const arrowSizeRatio = arrowViewBox.width / arrowViewBox.height;

        // size the arrow svg image according to its ratio
        const arrowHeight = 70;
        const arrowWidth = arrowHeight * arrowSizeRatio;

        // size the arrow container as a square based on the longest size of the arrow
        const containerSide = Math.max(arrowWidth, arrowHeight) * 1.2;
        containerSvg.size(containerSide, containerSide);

        // place and rotate the arrow inside its container
        arrowSvg
            .size(arrowWidth, arrowHeight)
            .center(containerSide / 2, containerSide / 2)
            .parent()
            .rotate(rotation, containerSide / 2, containerSide / 2);

        // create a container canvas with the same size and draw arrow svg onto that canvas
        const northarrowGraphic = graphicsService.createCanvas(containerSide, containerSide);
        const northarrowPromise = graphicsService.svgToCanvas(containerSvg, northarrowGraphic);

        return wrapOutput(northarrowPromise);
    }

    /**
     * Generates footer note graphic.
     *
     * @function footnoteGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function footnoteGenerator(showToast, value) {
        const exportSize = exportSizesService.selectedOption;

        // return empty graphic 0x0 if footnote text is not specified
        if (!angular.isString(value) || value === '') {
            return { graphic: graphicsService.createCanvas(0, 0) };
        }

        const footnoteText = value;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg();

        const footnoteSvg = containerSvg.textflow(footnoteText, exportSize.width).attr({
            'font-family': 'Roboto',
            anchor: 'start'
        });

        const textBox = footnoteSvg.bbox();
        containerSvg.size(textBox.width, Math.abs(textBox.y) + textBox.height);

        const timestampGraphic = graphicsService.createCanvas(textBox.width, Math.abs(textBox.y) + textBox.height);
        const footerPromise = graphicsService.svgToCanvas(containerSvg, timestampGraphic);

        return wrapOutput(footerPromise);
    }

    /**
     * Generates the timestamp graphic
     *
     * @function timestampGenerator
     * @param {Function} showToast a function display a toast notification for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function timestampGenerator() {
        const exportSize = exportSizesService.selectedOption;

        const timestampString = $filter('date')(new Date(), 'yyyy-MM-dd, h:mm a');

        const containerWidth = exportSize.width;
        let containerHeight = 100;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg(containerWidth, containerHeight);

        // create a timestamp
        const timestampSvg = containerSvg
            .text(timestampString)
            .attr({
                'font-family': 'Roboto',
                anchor: 'start'
            })
            .leading(1)
            .cx(containerWidth / 2);

        containerHeight = timestampSvg.bbox().height + EXPORT_IMAGE_GUTTER * 2;

        // position the timestamp at the bottom of the export image
        timestampSvg.cy(containerHeight / 2);

        containerSvg.height(containerHeight);

        const timestampGraphic = graphicsService.createCanvas(containerWidth, containerHeight);
        const timestampPromise = graphicsService.svgToCanvas(containerSvg, timestampGraphic);

        return wrapOutput(timestampPromise, timestampString);
    }

    /**
     * Generates an image of the supplied HTML string.
     *
     * @param {Function} showToast a function display a toast notification for the user
     * @param {*} value HTML string
     * @returns
     */
    function customMarkupGenerator(showToast, value) {
        // NOTE: example
        // so far, the plugin calling this generator is responsible for setting the size of the container supplied with value
        // if this generator is used internally, we might want to set the maximum width equal to `exportSize.width` on the container so it doesn't overflow the export image
        // in cases where value is plain text, it should be wrapped in a `div` or `p`
        /* value =
            '<div style="width: 500px;">This is a footnote added from the configuration file. The note is very long so it should wrap on multiple lines when it reaches a certain limit in size. Maybe some user will want to use this as aplace holder to put a lot of information so we need to be able to wrap this content. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce aliquet ante quis aliquet feugiat. Cras eget semper nunc, eu placerat purus. Nunc sed lacinia enim, ut sollicitudin quam. Nunc quis finibus massa, eget maximus enim. Donec ac nisl libero. Nunc eu pharetra arcu. Fusce luctus, magna cursus gravida tristique, risus nisi porttitor magna, ac dictum ipsum dui vel nulla. Integer id ornare augue. Quisque condimentum velit quis elementum porta. Sed dui enim, iaculis cursus diam volutpat, laoreet porta quam. Sed nec aliquet magna. Curabitur commodo fringilla metus, eu posuere sapien mollis nec.</div>'; */

        // create HTML element from the string provided and position it far away from the screen
        const valueNode = angular.element(value);
        valueNode.css({
            position: 'absolute',
            top: '-9999px',
            left: ' -9999px'
        });
        const body = angular.element('body');

        body.append(valueNode);

        // transcribe this HTML element to canvas and remove the element
        const h2cPromise = html2canvas(valueNode[0], { useCORS: true });
        h2cPromise.then(() => valueNode.remove());

        // return resulting canvas as a promise
        return wrapOutput(h2cPromise);
    }
}
