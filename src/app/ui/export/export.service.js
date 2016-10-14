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

        function ExportController($rootElement, $q, storageService, exportLegendService, geoService, gapiService) {
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
            self.includeLegend = includeLegend;
            self.lengendGraphic = null;

            self.close = service.close;

            const { serverPromise, localPromise } = gapiService.gapi.mapPrint.print(geoService.mapObject, {
                url: 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
                format: 'png32'
            });

            $q.resolve(serverPromise).then(canvas =>
                self.serviceGraphic = canvas);

            $q.resolve(localPromise).then(canvas =>
                self.localGraphic = canvas);

            $q.all([serverPromise, localPromise]).then(result => {
                self.isGenerationComplete = true;
            });

            /***/

            /**
             * Generates a legend graphic if it's absent and toggle its visibility in the dialog.
             * @private
             * @function inlcudeLegend
             */
            function includeLegend() {
                if (!self.legendGraphic && self.isLegendIncluded) {
                    self.legendGraphic = exportLegendService.generate(mapWidth, 350).node;
                }
            }
        }
    }
})();
