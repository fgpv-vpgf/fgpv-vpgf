/* global saveAs, SVG, canvg */
(() => {
    'use strict';

    const EXPORT_IMAGE_GUTTER = 20; // padding around the export image

    /**
     * @ngdoc service
     * @name exportService
     * @module app.ui
     * @requires dependencies
     * @description
     *
     * The `exportService` service description.
     *
     */
    angular
        .module('app.ui')
        .service('exportService', exportService);

    function exportService($mdDialog, $rootElement, storageService) {
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
            $mdDialog.show({
                controller: ExportController,
                controllerAs: 'self',
                bindToController: true,
                templateUrl: 'app/ui/export/export.html',
                parent: storageService.panels.shell,
                targetEvent: event,
                hasBackdrop: true,
                disableParentScroll: false,
                clickOutsideToClose: true,
                fullscreen: true
            });
        }

        /**
         * Closes the export dialog.
         * @function close
         */
        function close() {
            $mdDialog.hide();
        }

        function ExportController($rootElement, $q, $filter, configService, appInfo, storageService,
            exportLegendService, geoService, gapiService) {
            'ngInject';
            const self = this;

            const shellNode = storageService.panels.shell;
            const [mapWidth, mapHeight] = [shellNode.width(), shellNode.height()];

            // we need a dummy canvas graphic to stretch the export dialog to the proper size before we get any of the print images
            self.dummyGraphic = createCanvas();
            self.dummyGraphic.width = mapWidth;
            self.dummyGraphic.height = mapHeight;

            self.isGenerationComplete = false;

            self.isLegendIncluded = false;
            self.lengendGraphic = null;

            // functions
            self.saveImage = saveImage;
            self.includeLegend = includeLegend;
            self.close = service.close;

            // start the print task
            configService.getCurrent().then(config => {
                const { serverPromise, localPromise } = gapiService.gapi.mapPrint.print(geoService.mapObject, {
                    url: config.services.exportMapUrl,
                    format: 'png32'
                });

                // store graphic with service layers so it is bound to the ui
                $q.resolve(serverPromise).then(canvas =>
                    self.serviceGraphic = canvas);

                // store grapchi with local layers so it is bound to the ui
                $q.resolve(localPromise).then(canvas =>
                    self.localGraphic = canvas);

                // when both graphics are ready, allow the user to save the image
                $q.all([serverPromise, localPromise]).then(() =>
                    self.isGenerationComplete = true);
            });

            /***/

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
                    canvas.toBlob(blob => {
                        saveAs(blob, fileName);
                    });
                });

                /**
                 * Draws the shell of the export image.
                 * The shell includes title, notrh arrow, scale bar, timestamp, etc.
                 * NOTE: only title and timestamp are implemented
                 * @private
                 * @function drawMapShell
                 * @return {Promise} promise resolving with a shell graphic
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

                        // position title about the map image
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
