/* global RV */

import 'svg.textflow.js';

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
 *                          showToast {Function} - a function display a toast notifcation for the user
 *                          value {Object} [optional] - any value stored in the component
 *                      generator function may optionally return a value object which will override the component's stored value object (this can be useful if generator updates the value and it needs to persist)
 *
 * Generator should handle errors and display error notifications using the `showToast` function.
 */
angular
    .module('app.ui')
    .factory('exportGenerators', exportGenerators);

function exportGenerators($q, $filter, $translate, $templateCache, gapiService, configService, graphicsService,
    exportLegendService, geoService, mapToolService) {

    const service = {
        titleGenerator,

        mapDummyGenerator,
        mapLocalGenerator,
        mapServerGenerator,

        legendGenerator,

        northarrowGenerator,
        scalebarGenerator,

        timestampGenerator,

        footnoteGenerator
    };

    return service;

    /**
     * A helper function to wrap the generator output.
     * @function wrapOutput
     * @private
     * @param {Promise} graphicPromise a promise resolving with the generator result
     * @param {Object} value [optional] value passed to the generator and modified by it to be stored in the export component
     */
    function wrapOutput(graphicPromise, value) {
        return graphicPromise.then(graphic =>
            ({ graphic, value }));
    }

    // GENERATORS START
    /**
     * Generates the title of the export image.
     * @function titleGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function titleGenerator(exportSize, showToast, value) {
        const containerWidth = exportSize.width;
        let containerHeight = 30;

        // return empty graphic 0x0 if title text is not specified
        if (!angular.isString(value) || value === '') {
            return { graphic: graphicsService.createCanvas(0, 0) };
        }

        const titleText = value;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg(containerWidth, containerHeight);

        const titleSvg = containerSvg.text(titleText || '')
            .attr({
                'font-family': 'Roboto',
                'font-weight': 'normal',
                'font-size': 32,
                anchor: 'start'
            })
            .leading(1)
            .cx(containerWidth / 2);

        containerHeight = titleSvg.bbox().height + EXPORT_IMAGE_GUTTER;

        // position the timestamp at the bottom of the export image
        titleSvg.cy(containerHeight / 2);

        containerSvg.height(containerHeight);

        const titleGraphic = graphicsService.createCanvas(containerWidth, containerHeight);
        const titlePromise = graphicsService.svgToCanvas(containerSvg, titleGraphic);

        return wrapOutput(titlePromise);
    }

    /**
     * Generates an empty canvas with the currently selected size. This is needed to prevent the export dialog from collapsing until the map images can be generated.
     *
     * @function mapDummyGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function mapDummyGenerator(exportSize) {
        const dummyGraphic = graphicsService.createCanvas();
        dummyGraphic.width = exportSize.width;
        dummyGraphic.height = exportSize.height;

        return { graphic: dummyGraphic };
    }

    /**
     * Generates an image of the svg-based layers.
     *
     * @function mapLocalGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function mapLocalGenerator(exportSize) {
        const localGeneratorPromise = geoService.map.printLocal(exportSize);

        return wrapOutput(localGeneratorPromise);
    }

    /**
     * Generates an image of the image-based layers.
     *
     * @function mapServerGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function mapServerGenerator(exportSize, showToast) {
        const { map: { instance: mapInstance }, services: { exportMapUrl } } = configService.getSync;

        const serverGeneratorPromise = serverPrint(exportMapUrl);

        return wrapOutput(serverGeneratorPromise);

        function serverPrint(exportMapUrl, attempt = 0) {
            const serverPromise = mapInstance.printServer({
                url: exportMapUrl,
                format: 'png32',
                width: exportSize.width,
                height: exportSize.height
            });

            const wrapperPromise = $q((resolve, reject) => {
                $q.resolve(serverPromise)
                    .then(data => resolve(data))
                    .catch(error => {
                        attempt++;
                        console.error('exportGeneratorsService', `print task failed ` +
                            `on try ${attempt} with error`, error);
                        // print task with many layers will likely fail due to esri's proxy/cors issue https://github.com/fgpv-vpgf/fgpv-vpgf/issues/702
                        // submitting it a second time usually works; if not, submit a third time
                        if (attempt <= RETRY_LIMIT) {
                            console.log('exportGeneratorsService', `trying print task again`);
                            resolve(serverPrint(exportMapUrl, attempt));
                        } else {
                            // show error; likely service timeout
                            // self.isError = true;

                            showToast('error.timeout', { action: 'retry' })
                                .then(response => {
                                    if (response === 'ok') { // promise resolves with 'ok' when user clicks 'retry'
                                        attempt = 0;

                                        // self.isError = false;
                                        console.log('exportGeneratorsService', `trying print task again`);
                                        resolve(serverPrint(exportMapUrl, attempt));
                                    } else {
                                        reject();
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
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function legendGenerator(exportSize) {
        // update `exportLegendService.generate` function to take ExportSize object as the first parameter
        const legendPromise = exportLegendService.generate(exportSize.height, exportSize.width, 350);

        return wrapOutput(legendPromise);
    }

    /**
     * Generates scalebar graphic
     *
     * @function scalebarGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function scalebarGenerator(exportSize) {
        const containerWidth = exportSize.width;
        const containerHeight = 100;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg(containerWidth, containerHeight);
        const scalebarGroup = containerSvg.group();

        // get scale bar information (can specify output image size if not same as map size)
        // need to specify containerWidth because when we resize the container width may changed
        // if we don't do this, scale bar does not update when output is resized
        const scale = geoService.map.getScaleRatio(containerWidth);

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
        const imperial = getScaleInfo((scale.ratio / 1.6), scale.units[1]);
        attr.y = 30;
        scalebarGroup.line(0, 29, imperial.width, 29).stroke('black');
        scalebarGroup.text(imperial.label).attr(attr);

        scalebarGroup.move(20, (containerHeight - 49) / 2);

        const scalebarGraphic = graphicsService.createCanvas(containerWidth, containerHeight);
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
            const scaleRatio = (120 * ratio);

            // find modulo value to use
            const modulo = Math.pow(10, (Math.floor(Math.log(scaleRatio) / Math.LN10) + 1) - 1);

            // get bar length
            const bar = (scaleRatio) - (scaleRatio % modulo);

            // return label and pixel bar length
            // add approx to warn user about using scale bar as a ruler (scalebar is always approximative)
            return {
                label: `${parseFloat(bar.toFixed(1))
                    .toString()}${unit} ${$translate.instant('export.label.approx')}`,
                width: `${Math.floor((bar * 120) / scaleRatio)}`
            };
        }
    }

    /**
     * Generates north arrow graphic.
     *
     * @function northarrowGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function northarrowGenerator(exportSize) {
        // TOOD: move this into assets
        // jscs:disable maximumLineLength
        const arrowSCG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61.06 96.62"><g transform="translate(-1.438 30.744)"><g fill="none" stroke="#000"><path d="m61 35c0 16.02-12.984 29-29 29-16.02 0-29-12.984-29-29 0-16.02 12.984-29 29-29 16.02 0 29 12.984 29 29z" stroke-width="3"/><path d="m55 35c0 12.979-10.521 23.5-23.5 23.5-12.979 0-23.5-10.521-23.5-23.5 0-12.979 10.521-23.5 23.5-23.5 12.979 0 23.5 10.521 23.5 23.5z" transform="matrix(1.01148 0 0 .99988-.089.004)" stroke-width=".497"/><path d="m32 35v-32" stroke-width=".25"/></g><path d="m32-9.453l28.938 73.826-29-29-29 29z" fill="#fff" stroke="#fff" stroke-width="3"/><path d="m32-9.453l29 73.45-29-29-29 29z" fill="none" stroke="#000" stroke-linecap="square"/><text x="22.71" y="-10.854" font-family="OPEN SANS" word-spacing="0" line-height="125%" letter-spacing="0" font-size="40"><tspan x="22.71" y="-10.854" font-family="Adobe Heiti Std R" font-size="26">N</tspan></text></g><g transform="translate(0-3.829)" fill="none" stroke="#000" stroke-width=".25"><path d="m4 92.82l6.74-3.891"/><path d="m4.603 90.7l10.397-6"/><path d="m3 95.17l4-2.309"/><path d="m5.442 88.45l13.856-8"/><path d="m12 72.26l18.686-10.812"/><path d="m14.593 65.45l16.09-9.291"/><path d="m15.343 63.24l15.343-8.858"/><path d="m16.877 60.58l13.809-7.972"/><path d="m17.511 58.45l13.174-7.606"/><path d="m18.412 56.15l12.274-7.087"/><path d="m19 54.04l11.427-6.597"/><path d="m20 51.757l10.822-6.311"/><path d="m20.826 49.45l9.86-5.693"/><path d="m21.48 47.3l9.206-5.315"/><path d="m23 44.647l7.686-4.437"/><path d="m23.744 42.45l6.928-4"/><path d="m24.549 40.21l6.137-3.543"/><path d="m25 38.18l5.686-3.283"/><path d="m26.663 35.446l4.02-2.323"/><path d="m27.617 33.12l3.069-1.772"/><path d="m28 31.13l2.686-1.551"/><path d="m29.15 28.694l1.534-.886"/><path d="m13 69.909l17.686-10.211"/><path d="m9.206 79.19l21.48-12.402"/><path d="m8.36 81.45l22.326-12.89"/><path d="m7.671 83.62l19.946-11.516"/><path d="m6.137 86.27l17.02-9.827"/><path d="m10 76.956l20.686-11.943"/><path d="m11.279 74.45l19.407-11.205"/><path d="m14 67.56l16.686-9.634"/><path d="m30.562 65.744v-43.566" transform="translate(0 3.829)"/></g></svg>`;
        // jscs:enable maximumLineLength

        const rotation = mapToolService.northArrow().rotationAngle;

        const containerWidth = exportSize.width;
        const containerHeight = 100;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg(containerWidth, containerHeight);

        const arrowSvg = containerSvg.group().svg(arrowSCG).first();
        const arrowViewBox = arrowSvg.viewbox();
        const arrowSizeRatio = arrowViewBox.width / arrowViewBox.height;

        const arrowHeight = 70;
        const arrowWidth = arrowHeight * arrowSizeRatio;

        const [arrowX, arrowY] = [containerWidth - 20 - arrowWidth, (containerHeight - arrowHeight) / 2];

        arrowSvg
            .size(arrowWidth, arrowHeight)
            .move(arrowX, arrowY)
            .rotate(rotation, arrowX + arrowWidth / 2, arrowY + arrowHeight / 2);

        const northarrowGraphic = graphicsService.createCanvas(containerWidth, containerHeight);
        const northarrowPromise = graphicsService.svgToCanvas(containerSvg, northarrowGraphic);

        return wrapOutput(northarrowPromise);
    }

    /**
     * Generates footer note graphic.
     *
     * @function footnoteGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function footnoteGenerator(exportSize, showToast, value) {
        const containerWidth = exportSize.width;
        let containerHeight = 30;

        // return empty graphic 0x0 if footnote text is not specified
        if (!angular.isString(value) || value === '') {
            return { graphic: graphicsService.createCanvas(0, 0) };
        }

        const footnoteText = value;

        // create an svg node to draw a timestamp on
        const containerSvg = graphicsService.createSvg(containerWidth, containerHeight);

        const footnoteSvg = containerSvg
            .textflow(footnoteText, containerWidth - 20 * 2)
            .attr({
                'font-family': 'Roboto',
                anchor: 'start'
            })
            .leading(1)
            .cx((containerWidth - 20 * 2) / 2);

        containerHeight = footnoteSvg.bbox().height + 30;

        // position the timestamp at the bottom of the export image
        footnoteSvg.cy(containerHeight / 2 + 10);

        containerSvg.height(containerHeight);

        const timestampGraphic = graphicsService.createCanvas(containerWidth, containerHeight);
        const footerPromise = graphicsService.svgToCanvas(containerSvg, timestampGraphic);

        return wrapOutput(footerPromise);
    }

    /**
     * Generates the timestamp graphic
     *
     * @function timestampGenerator
     * @param {ExportSize} exportSize the currently selected map size
     * @param {Function} showToast a function display a toast notifcation for the user
     * @param {Object} value any value stored in the ExportComponent related to this generator
     * @return {Object} a result object in the form of { graphic, value }
     *                  graphic {Canvas} - a resulting graphic
     *                  value {Object} - a modified value passed from the ExportComponent
     */
    function timestampGenerator(exportSize) {
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
}
