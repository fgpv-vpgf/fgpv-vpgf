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

    function Controller(geoService, basemapService, configService, events) {
        'ngInject';
        const self = this;

        configService.onEveryConfigLoad(config =>
            (self.map = config.map));

        self.geoService = geoService;

        self.selectBasemap = basemap => {
            configService.getSync.map.selectedBasemap.deselect();
            basemap.select();
            geoService.map.selectBasemap(basemap.id);
            events.$broadcast(events.rvBasemapChange);
        }

        self.close = basemapService.close;
    }
})();
