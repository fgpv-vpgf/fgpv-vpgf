/* global saveAs */
(() => {
    'use strict';

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

        function ExportController($rootElement, $q, configService, storageService, exportLegendService, geoService, gapiService) {
            'ngInject';
            const self = this;

            const shellNode = storageService.panels.shell;
            const [mapWidth, mapHeight] = [shellNode.width(), shellNode.height()];

            // we need a dummy canvas graphic to stretch the export dialog to the proper size before we get any of the print images
            self.dummyGraphic = document.createElement('canvas');
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

                $q.resolve(serverPromise).then(canvas =>
                    self.serviceGraphic = canvas);

                $q.resolve(localPromise).then(canvas =>
                    self.localGraphic = canvas);

                $q.all([serverPromise, localPromise]).then(result => {
                    self.isGenerationComplete = true;
                });
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
                    // self.legendGraphic = exportLegendService.generate(mapWidth, 350).node;
                }
            }

            function saveImage() {
                const gutter = 20;

                const canvas = document.createElement('canvas')
                canvas.width = self.dummyGraphic.width + gutter * 2;
                canvas.height = self.dummyGraphic.height + gutter * 2;

                const context = canvas.getContext('2d');
                fillCanvas();

                if (self.isLegendIncluded) {
                    canvas.height = canvas.height + self.legendGraphic.height;

                    fillCanvas();
                    context.drawImage(self.legendGraphic, gutter, self.dummyGraphic.height + gutter);
                }

                context.drawImage(self.serviceGraphic, gutter, gutter);
                context.drawImage(self.localGraphic, gutter, gutter);

                // context.drawImage(self.legendGraphic, 0, mapHeight);
                // draw to canvas...
                // canvas = context.canvas;
                canvas.toBlob(blob => {
                    saveAs(blob, Math.random() + "pretty image.png");
                });

                function fillCanvas() {
                    context.fillStyle = '#fff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
        }
    }
})();
