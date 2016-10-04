(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name exportService
     * @module app.ui.export
     * @requires dependencies
     * @description
     *
     * The `exportService` service description.
     *
     */
    angular
        .module('app.ui.export')
        .service('exportService', exportService);

    function exportService($mdDialog, $rootElement, storageService) {
        const service = {
            open,
            close
        };

        return service;

        /***/

        function open(event) {
            $mdDialog.show({
                controller: ExportController,
                /*locals: {
                    width: storageService.panels.shell.width(),
                    height: storageService.panels.shell.height()
                },*/
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

        function close() {
            $mdDialog.hide();
        }

        function ExportController($rootElement, storageService, exportLegendService) {
            'ngInject';
            const self = this;

            self.isLegendIncluded = false;
            self.includeLegend = includeLegend;
            self.lengendGraphic = null;

            self.close = service.close;

            /***/

            function includeLegend() {
                if (!self.legendGraphic && self.isLegendIncluded) {
                    self.legendGraphic = exportLegendService.generate(storageService.panels.shell.width(), 350).node;
                }
            }
        }
    }
})();
