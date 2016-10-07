(() => {
    'use strict';

    /**
     * @module rvBasemap
     * @memberof app.ui.basemap
     * @restrict E
     * @description
     *
     * The `rvBasemap` directive displays a basemap selector. Its template uses a content pane which is loaded into the `other` panel opening on the right side of the screen. Selector groups basemaps by projection.
     *
     */
    angular
        .module('app.ui.basemap')
        .directive('rvBasemap', rvBasemap);

    function rvBasemap() {
        const directive = {
            restrict: 'A',
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(basemapService) {
        'ngInject';
        const self = this;

        self.minimize = basemapService.close;

        basemapService.setOnChangeCallback((projs, selectedBM) => {
            self.projections = projs;
            self.selectedWkid = selectedBM.wkid;
        });

        self.select = bm => {
            basemapService.select(bm);
            self.selectedWkid = basemapService.getSelected().wkid;
        };
    }
})();
