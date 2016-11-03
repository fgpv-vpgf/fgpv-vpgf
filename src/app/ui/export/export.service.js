/* global saveAs, SVG, canvg */
(() => {
    'use strict';

    const EXPORT_IMAGE_GUTTER = 20; // padding around the export image
    const RETRY_LIMIT = 3;
    const EXPORT_CLASS = '.rv-export';

    /**
     * @ngdoc service
     * @name exportService
     * @module app.ui
     * @requires dependencies
     * @description
     *
     * The `exportService` service description opens the export dialog and generates the export image.
     * Provides two functions:
     *  - open: opens the export dialog and start a new print task
     *  - close: closes the export dialog
     */
    angular
        .module('app.ui')
        .service('exportService', exportService);

    function exportService($mdDialog, $mdToast, storageService) {
        let requestCount = 0;

        const service = {
            open,
            close
        };

        return service;

        /***/

        /**
         * Opens the export dialog.
         * @function open
         * @param {Object} event original click event
         */
        function open(event) {
            const shellNode = storageService.panels.shell;

            $mdDialog.show({
                locals: {
                    shellNode
                },
                controller: ExportController,
                controllerAs: 'self',
                bindToController: true,
                templateUrl: 'app/ui/export/export.html',
                parent: shellNode,
                targetEvent: event,
                hasBackdrop: true,
                disableParentScroll: false,
                clickOutsideToClose: true,
                fullscreen: true,
                onRemoving: $mdToast.hide,
                onShowing: (scope, element) =>
                    scope.element = element.find(EXPORT_CLASS) // store dialog DOM node for reference
            });
        }

        /**
         * Closes the export dialog.
         * @function close
         */
        function close() {
            $mdDialog.hide();
        }

        function ExportController($translate, $mdToast, $q, $filter, configService, appInfo,
            exportLegendService, geoService, gapiService) {
            'ngInject';
            const self = this;

            let attempt = 0;

            const [mapWidth, mapHeight] = [self.shellNode.width(), self.shellNode.height()];

            // we need a dummy canvas graphic to stretch the export dialog to the proper size before we get any of the print images
            self.dummyGraphic = createCanvas();
            self.dummyGraphic.width = mapWidth;
            self.dummyGraphic.height = mapHeight;

            self.isError = false;
            self.isTainted = false; // indicates the canvas is tainted and cannot be directly saved

            self.isGenerationComplete = false;

            self.isLegendIncluded = false;
            self.isScaleIncluded = false;
            self.isArrowIncluded = false;
            self.infoHeight = [];
            self.lengendGraphic = null;

            // functions
            self.saveImage = saveImage;
            self.includeLegend = includeLegend;

            self.close = service.close;

            configService.getCurrent().then(config => {
                startPrintTask(config.services.exportMapUrl, config.export);
            });

            /***/

            /**
             * @function startPrintTask
             * @private
             * @param {String} exportMapUrl url of the print service
             * @param {Object} exportParams export parameters from config file
             * @param {Number} requestId [optional] current requestId used to detect stale requests
             */
            function startPrintTask(exportMapUrl, exportParams, requestId = ++requestCount) {
                // set footnote
                includeFootnote(exportParams);

                // set north arrow
                includeArrow();

                // set scale
                includeScale();

                // start the print task
                const { serverPromise, localPromise } = gapiService.gapi.mapPrint.print(geoService.mapObject, {
                    url: exportMapUrl,
                    format: 'png32'
                });

                // NOTE: geoApi returns Promise object, but it resolves outside of the Angular digest cycle and we need to trigger one on `then` to update the bindings. The easiest way here is to use `$q.resolve`, but `$timeout` or `$applyAsync` would also work.
                // store graphic with service layers so it is bound to the ui
                // store graphic with local layers so it is bound to the ui
                [[serverPromise, 'serviceGraphic'], [localPromise, 'localGraphic']]
                    .forEach(data => checkRequest(...data));

                // when both graphics are ready, allow the user to save the image
                $q.all([serverPromise, localPromise])
                    .then(() =>

                        // if print promises resolve and the requestId is stale, do not set generation status as complete: solves https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1285
                        requestId === requestCount ?
                            (self.isGenerationComplete = true) :
                            console.log(`Map Export request ${requestId} has expired.`))
                    .catch(error => {
                        attempt++;

                        console.error(`Print task failed on try ${attempt}`);
                        console.error(error);

                        // print task with many layers will likely fail due to esri's proxy/cors issue https://github.com/fgpv-vpgf/fgpv-vpgf/issues/702
                        // submitting it a second time usually works; if not, submit a third time
                        if (attempt <= RETRY_LIMIT) {
                            console.log(`Trying print task again`);
                            startPrintTask(exportMapUrl);
                        } else {
                            // show error; likely service timeout
                            self.isError = true;
                            showToast('error.timeout', { action: 'retry' })
                                .then(response => {
                                    if (response === 'ok') { // promise resolves with 'ok' when user clicks 'retry'
                                        attempt = 0;
                                        self.isError = false;
                                        console.log(`Trying print task again`);
                                        startPrintTask(exportMapUrl);
                                    }
                                });
                        }
                    });

                /**
                 * Checks if the print request is stale and assigns its result to the graphic.
                 * @function checkRequest
                 * @private
                 * @param {Promise} promise print promise which resolves when its canvas is ready
                 * @param {String} graphicName name of the target graphic the canvas needs to be assigned to
                 */
                function checkRequest(promise, graphicName) {
                    promise.then(canvas =>
                        requestId === requestCount ? (self[graphicName] = canvas) : angular.noop());
                }
            }

            /**
             * Show a notification toast.
             * I think I'm being clever with default values here.
             * @function showToast
             * @private
             * @param {String} textContent translation key of the string to display in the toast
             * @param {Object} [optional] action word to be displayed on the toast; toast delay before hiding
             * @return {Promise} promise resolves when the user clicks the toast button or the timer runs out
             */
            function showToast(textContent, { action = 'close', hideDelay = 0 } = {}) {
                const options = {
                    parent: self.scope.element || self.shellNode,
                    position: 'bottom rv-flex-global',
                    textContent: $translate.instant(`export.${textContent}`),
                    action: $translate.instant(`export.${action}`),
                    hideDelay
                };

                return $mdToast.show($mdToast.simple(options));
            }

            /**
             * Generates a legend graphic if it's absent and toggle its visibility in the dialog.
             * @private
             * @function inlcudeLegend
             */
            function includeLegend() {
                if (!self.legendGraphic && self.isLegendIncluded) {
                    exportLegendService.generate(mapHeight, mapWidth, 350)
                        .then(graphic =>
                            self.legendGraphic = graphic);
                }
            }

            /**
             * Generates footnote information
             * @function includeFootnote
             * @param {Object} exportParams export map parameters from config file
             */
            function includeFootnote(exportParams) {
                self.footnote = (exportParams && exportParams.footnote) ? exportParams.footnote : '';

                // add footnote
                self.footnoteHeight = 0;
                if (self.footnote) {
                    const shellWidth = mapWidth / 2;
                    const footnote = wrapFootnote(self.footnote, shellWidth);
                    self.footnoteHeight = footnote.height();

                    const localCanvas = createCanvas(); // create canvas element
                    localCanvas.width = shellWidth;
                    localCanvas.height = self.footnoteHeight;
                    canvg(localCanvas, footnote.node.outerHTML, {
                            ignoreAnimation: true,
                            ignoreMouse: true,
                            renderCallback: () => {
                                self.footnoteGraphic = localCanvas;
                                self.infoHeight.push(self.footnoteGraphic.height);
                            }
                        });
                } else {
                    self.infoHeight.push(0);
                }
            }

            /**
             * Wrap footnote on multiple lines
             * @function wrapFootnote
             * @param {String} text footnote
             * @param {Number} width maximum width for one lineCount
             * @return {Object} shellSvg SVG element who contain footnote
             */
            function wrapFootnote(text, width) {
                // create svg element
                const shellSvg = SVG(document.createElement('div')).size(width);

                // create canvas element to be use to measure the maximum width
                const context = document.createElement('canvas').getContext('2d');
                context.font = '12px Roboto';

                // initialize placement properties
                const lineHeight = 1.1; // ems
                let lineNumber = 0;
                let y = 0;
                const attr = {
                    'font-family': 'Roboto',
                    'font-weight': 'normal',
                    'font-size': 12,
                    x: 0,
                    y: y,
                    dy: ++lineNumber * lineHeight + 'em',
                    anchor: 'start'
                };

                // split words and set the first one to use
                const words = text.split(/\s+/).reverse();
                let word = words.pop();
                let line = [];
                text = '';

                // until there is no word in the array, loop trought them
                while (word) {
                    line.push(word);
                    text = line.join(' ');

                    // check if maximum width. If so add a line, if not add new word
                    if (context.measureText(text).width > width) {
                        // remove last word because it exceed max width
                        line.pop();
                        attr.y = y;
                        attr.dy = ++lineNumber * lineHeight + 'em';
                        shellSvg.text(line.join(' ')).attr(attr);

                        // new line will start the word who exceed width
                        line = [word];
                        y += 10;
                    }

                    word = words.pop();
                }

                // add last line
                attr.y = y;
                attr.dy = ++lineNumber * lineHeight + 'em';
                shellSvg.text(line.join(' ')).attr(attr);

                // set height from the number of line
                shellSvg.height(lineNumber * 30);

                return shellSvg;
            }

            /**
             * Generates north arrow information
             * @function includeArrow
             */
            function includeArrow() {
                const rotation = gapiService.gapi.mapManager.getNorthArrowAngle(geoService.mapObject) - 180;
                // jscs:disable maximumLineLength
                const arrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61.06 96.62"><g transform="rotate(${rotation} 30 48)translate(-1.438 30.744)"><g fill="none" stroke="#000"><path d="m61 35c0 16.02-12.984 29-29 29-16.02 0-29-12.984-29-29 0-16.02 12.984-29 29-29 16.02 0 29 12.984 29 29z" stroke-width="3"/><path d="m55 35c0 12.979-10.521 23.5-23.5 23.5-12.979 0-23.5-10.521-23.5-23.5 0-12.979 10.521-23.5 23.5-23.5 12.979 0 23.5 10.521 23.5 23.5z" transform="matrix(1.01148 0 0 .99988-.089.004)" stroke-width=".497"/><path d="m32 35v-32" stroke-width=".25"/></g><path d="m32-9.453l28.938 73.826-29-29-29 29z" fill="#fff" stroke="#fff" stroke-width="3"/><path d="m32-9.453l29 73.45-29-29-29 29z" fill="none" stroke="#000" stroke-linecap="square"/><text x="22.71" y="-10.854" font-family="OPEN SANS" word-spacing="0" line-height="125%" letter-spacing="0" font-size="40"><tspan x="22.71" y="-10.854" font-family="Adobe Heiti Std R" font-size="26">N</tspan></text></g><g transform="rotate(${rotation} 30 48) translate(0-3.829)" fill="none" stroke="#000" stroke-width=".25"><path d="m4 92.82l6.74-3.891"/><path d="m4.603 90.7l10.397-6"/><path d="m3 95.17l4-2.309"/><path d="m5.442 88.45l13.856-8"/><path d="m12 72.26l18.686-10.812"/><path d="m14.593 65.45l16.09-9.291"/><path d="m15.343 63.24l15.343-8.858"/><path d="m16.877 60.58l13.809-7.972"/><path d="m17.511 58.45l13.174-7.606"/><path d="m18.412 56.15l12.274-7.087"/><path d="m19 54.04l11.427-6.597"/><path d="m20 51.757l10.822-6.311"/><path d="m20.826 49.45l9.86-5.693"/><path d="m21.48 47.3l9.206-5.315"/><path d="m23 44.647l7.686-4.437"/><path d="m23.744 42.45l6.928-4"/><path d="m24.549 40.21l6.137-3.543"/><path d="m25 38.18l5.686-3.283"/><path d="m26.663 35.446l4.02-2.323"/><path d="m27.617 33.12l3.069-1.772"/><path d="m28 31.13l2.686-1.551"/><path d="m29.15 28.694l1.534-.886"/><path d="m13 69.909l17.686-10.211"/><path d="m9.206 79.19l21.48-12.402"/><path d="m8.36 81.45l22.326-12.89"/><path d="m7.671 83.62l19.946-11.516"/><path d="m6.137 86.27l17.02-9.827"/><path d="m10 76.956l20.686-11.943"/><path d="m11.279 74.45l19.407-11.205"/><path d="m14 67.56l16.686-9.634"/><path d="m30.562 65.744v-43.566" transform="translate(0 3.829)"/></g></svg>`;
                // jscs:enable maximumLineLength

                const localCanvas = createCanvas(); // create canvas element
                localCanvas.width = 75;
                localCanvas.height = 75;
                canvg(localCanvas, arrow, {
                        ignoreAnimation: true,
                        ignoreMouse: true,
                        renderCallback: () => {
                            self.arrowGraphic = localCanvas;
                            self.infoHeight.push(self.arrowGraphic.height);
                        }
                    });
            }

            /**
             * Generates scale bar information
             * @function includeScale
             */
            function includeScale() {
                // create svg element
                const shellSvg = SVG(document.createElement('div')).size(150, 60);

                // get scale bar information (can specify output image size if not same as map size)
                const scale = gapiService.gapi.mapManager.getScaleRatio(geoService.mapObject);

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
                shellSvg.text(metric.label).attr(attr);
                shellSvg.line(0, 22, metric.width, 22).stroke('black');

                // set label and pixel length for imperial
                const imperial = getScaleInfo((scale.ratio / 1.6), scale.units[1]);
                attr.y = 30;
                shellSvg.line(0, 29, imperial.width, 29).stroke('black');
                shellSvg.text(imperial.label).attr(attr);

                const localCanvas = createCanvas(); // create canvas element
                localCanvas.width = 150;
                localCanvas.height = 100;
                canvg(localCanvas, shellSvg.node.outerHTML, {
                        ignoreAnimation: true,
                        ignoreMouse: true,
                        renderCallback: () => {
                            self.scaleGraphic = localCanvas;
                            self.infoHeight.push(self.scaleGraphic.height);
                        }
                    });
            }

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
                    label:  `${parseFloat(bar.toFixed(1))
                        .toString()}${unit} ${$translate.instant('export.label.approx')}`,
                    width: `${Math.floor((bar * 120) / scaleRatio)}`
                };
            }

            /**
             * Creates a canvas DOM node;
             * @function createCanvas
             * @private
             * @return {Object} canvas DOM node
             */
            function createCanvas() {
                return document.createElement('canvas');
            }

            /**
             * Generates the final canvas from created pieces and saves it as a file.
             * It creates a shell graphic with map title (if any), and the timestamp (north arrow and scalebar will be included in the future) and applies server and local export images on top of it, adding legend graphic at the bottom (if any).
             * @function saveImage
             * @private
             */
            function saveImage() {
                const timestampString = $filter('date')(new Date(), 'yyyy-MM-dd hh:mm:ss');
                const canvas = createCanvas(); // this will hold the resultant image

                // this is a promise since converting svg to canvas is an async call
                // mapOffset > 0 only when a title is provided by a user
                drawMapShell().then(({ shellGraphic, mapOffset, legendOffset, infoOffset }) => {

                    canvas.width = shellGraphic.width;
                    canvas.height = shellGraphic.height;

                    // set background to white
                    const context = canvas.getContext('2d');
                    context.fillStyle = '#fff';
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    // draw parts of the export image on the canvas
                    context.drawImage(self.serviceGraphic, EXPORT_IMAGE_GUTTER, mapOffset);
                    context.drawImage(self.localGraphic, EXPORT_IMAGE_GUTTER, mapOffset);

                    // draw legend, scale, arrow and footnote
                    drawInfo(context, mapOffset, legendOffset, infoOffset);

                    context.drawImage(shellGraphic, 0, 0);

                    // file name is either the title provided by the user or app id + timestamp
                    const fileName = `${self.exportTitle || `${appInfo.id} - ${timestampString}`}.png`;

                    try {
                        canvas.toBlob(blob => {
                            saveAs(blob, fileName);
                        });
                    } catch (error) {
                        // show error; nothing works
                        self.isError = true;

                        // this one is likely a tainted canvas issue
                        if (error.name === 'SecurityError') {
                            showToast('error.tainted');

                            // some browsers (not IE) allow to right-click a canvas on the page and save it manually;
                            // only when tainted, display resulting canvas inside the dialog, so users can save it manually, if the browser supports it
                            self.isTainted = true;
                            self.taintedGraphic = canvas;
                        } else {
                            // something else happened
                            showToast('error.somethingelseiswrong');
                        }
                    }
                });

                /**
                 * Draw legend, scalebar, north arrow and footnote if they are present
                 * @function drawInfo
                 * @private
                 * @param {Object} context the canvas context to draw to
                 * @param {Number} mapOffset the map offset
                 * @param {Number} legendOffset the legend offset
                 * @param {Number} infoOffset the information section offset
                 */
                function drawInfo(context, mapOffset, legendOffset, infoOffset) {
                    // only render legend graphic on canvas if it's included;
                    // the legend graphic could be cached, but not included - user first inlcuded then removes the legend, for example
                    // a cached (but not included) legend graphic rendered this way to the canvas won't be visible (most likely), since it will be ouside the canvas boundary; however, if the legend graphic is tainted it will prevent the export image from saving directly
                    let isBorder = false;
                    if (self.isLegendIncluded) {
                        context.drawImage(self.legendGraphic, EXPORT_IMAGE_GUTTER, legendOffset);
                        isBorder = true;
                    }

                    // only render graphic on canvas if it's included
                    const fullWidth = (canvas.width + 2 * EXPORT_IMAGE_GUTTER);
                    if (self.footnote) {
                        context.drawImage(self.footnoteGraphic, fullWidth / 2, infoOffset);
                    }

                    // only render graphic on canvas if it's included
                    if (self.isArrowIncluded) {
                        context.drawImage(self.arrowGraphic, fullWidth * 0.40, infoOffset + 10);
                        isBorder = true;
                    }

                    // only render graphic on canvas if it's included
                    if (self.isScaleIncluded) {
                        context.drawImage(self.scaleGraphic, EXPORT_IMAGE_GUTTER, infoOffset);
                        isBorder = true;
                    }

                    // draw border
                    if (isBorder) {
                        context.globalCompositeOperation = 'source-over';
                        context.lineWidth = 1;
                        context.strokeStyle = '#B6B6B6';
                        context.strokeRect(EXPORT_IMAGE_GUTTER, mapOffset,
                            self.serviceGraphic.width, self.serviceGraphic.height);
                    }
                }

                /**
                 * Draws the shell of the export image.
                 * The shell includes title, notrh arrow, scale bar, timestamp, etc.
                 * NOTE: only title and timestamp are implemented
                 * @private
                 * @function drawMapShell
                 * @return {Promise} promise resolving with an object containing:
                 * - shellGraphic;
                 * - mapOffset: the distance the map image should be offset from the top of the canvas to accommodate the title (if any)
                 * - legendOffset: the distance the legend graphic should be offset from the top of the canvas to to accommodate the map image and the title (if any)
                 */
                function drawMapShell() {
                    let mapOffset = EXPORT_IMAGE_GUTTER;

                    const shellGraphic = createCanvas();

                    // get height from info (footnote, arrow and scale).
                    const infoHeights = [self.infoHeight[0]];
                    if (self.isArrowIncluded) {
                        infoHeights.push(self.infoHeight[1]);
                    }
                    if (self.isScaleIncluded) {
                        infoHeights.push(self.infoHeight[2]);
                    }
                    const infoHeight = Math.max.apply(null, infoHeights);

                    // export image height depends on presence of title, info (scale, arrow footnote) and legend
                    let shellHeight = mapHeight + EXPORT_IMAGE_GUTTER * 2 +
                        (self.isLegendIncluded ? self.legendGraphic.height : 0) +
                        infoHeight;
                    const shellWidth = mapWidth + EXPORT_IMAGE_GUTTER * 2;

                    // create an svg node to draw a shell on
                    const shellSvg = SVG(document.createElement('div'))
                        .size(shellWidth, shellHeight);

                    if (self.exportTitle) {
                        // NOTE: title is rendedred as a single line at the moment, overflow will be cropped
                        const title = shellSvg.text(self.exportTitle)
                            .attr({
                                'font-family': 'Roboto',
                                'font-weight': 'normal',
                                'font-size': 32,
                                anchor: 'start'
                            })
                            .leading(1);

                        const titleHeight = title.bbox().height;
                        mapOffset = titleHeight + EXPORT_IMAGE_GUTTER * 2;

                        // position title above the map image
                        title
                            .cx(shellWidth / 2)
                            .dy((EXPORT_IMAGE_GUTTER + mapOffset - titleHeight) / 2 - 4);

                        // increase the resultant image height by the height of the title (+ white space)
                        shellHeight += mapOffset;
                        shellSvg.height(shellHeight);
                    }

                    // create a timestamp
                    const timestamp = shellSvg
                        .text(timestampString)
                        .leading(1);

                    // position the timestamp at the bottom of the export image
                    timestamp
                        .cx(shellWidth / 2)
                        .dy(shellHeight - (EXPORT_IMAGE_GUTTER + timestamp.bbox().height) / 2 - 4);

                    shellGraphic.height = shellHeight;
                    shellGraphic.width = shellWidth;

                    const legendOffset = mapHeight + mapOffset + infoHeight;
                    const infoOffset = mapHeight + mapOffset;

                    const drawShellPromise = $q(resolve => {
                        canvg(shellGraphic, shellSvg.node.outerHTML, {
                            ignoreAnimation: true,
                            ignoreMouse: true,
                            renderCallback: () =>
                                resolve({
                                    shellGraphic,
                                    mapOffset,
                                    legendOffset,
                                    infoOffset
                                })
                        });
                    });

                    return drawShellPromise;
                }
            }
        }
    }
})();
