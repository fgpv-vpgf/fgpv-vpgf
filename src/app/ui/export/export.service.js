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

            self.isGenerationComplete = false;

            self.isLegendIncluded = false;
            self.lengendGraphic = null;

            // functions
            self.saveImage = saveImage;
            self.includeLegend = includeLegend;
            self.close = service.close;

            configService.getCurrent().then(config =>
                startPrintTask(config.services.exportMapUrl));

            /***/

            /**
             * @function startPrintTask
             * @private
             * @param {String} exportMapUrl url of the print service
             * @param {Number} requestId [optional] current requestId used to detect stale requests
             */
            function startPrintTask(exportMapUrl, requestId = ++requestCount) {
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
                    exportLegendService.generate(mapWidth, 350)
                        .then(graphic =>
                            self.legendGraphic = graphic);
                }
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
                drawMapShell().then(({ shellGraphic, mapOffset, legendOffset }) => {

                    canvas.width = shellGraphic.width;
                    canvas.height = shellGraphic.height;

                    // set background to white
                    const context = canvas.getContext('2d');
                    context.fillStyle = '#fff';
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    // draw parts of the export image on the canvas
                    context.drawImage(self.serviceGraphic, EXPORT_IMAGE_GUTTER, mapOffset);
                    context.drawImage(self.localGraphic, EXPORT_IMAGE_GUTTER, mapOffset);
                    context.drawImage(self.legendGraphic || createCanvas(), EXPORT_IMAGE_GUTTER, legendOffset);
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
                            // TODO: seems browsers allow to right-click a canvas on the page and save it manually; we can output the final canvas on the page and instruct user how to save it manually
                            showToast('error.tainted');
                        } else {
                            // something else happened
                            showToast('error.somethingelseiswrong');
                        }

                    }
                });

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

                    // export image height depends on presence of title and legend
                    let shellHeight = mapHeight + EXPORT_IMAGE_GUTTER * 2 +
                        (self.isLegendIncluded ? self.legendGraphic.height : 0);
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

                    const legendOffset = mapHeight + mapOffset;

                    const drawShellPromise = $q(resolve => {
                        canvg(shellGraphic, shellSvg.node.outerHTML, {
                            ignoreAnimation: true,
                            ignoreMouse: true,
                            renderCallback: () =>
                                resolve({
                                    shellGraphic,
                                    mapOffset,
                                    legendOffset
                                })
                        });
                    });

                    return drawShellPromise;
                }
            }
        }
    }
})();
