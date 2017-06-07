/**
 * @module rvBasemap
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvBasemap` directive displays a basemap selector. Its template uses a content pane which is loaded into the `other` panel opening on the right side of the screen. Selector groups basemaps by projection.
 *
 */
angular
    .module('app.ui')
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

function Controller(geoService, mapService, basemapService, configService, events, reloadService) {
    'ngInject';
    const self = this;

    configService.onEveryConfigLoad(config =>
        (self.map = config.map));

    self.geoService = geoService;

    self.close = basemapService.close;
    self.selectBasemap = selectBasemap;

    return;

    /**
     * Change the the current basemap to the selected one.
     * This will change the projection and trigger map reload if the selected basemap in a different projection.
     *
     * @function selectBasemap
     * @param {Basempa} newBasemap a Basemap object from the config
     */
    function selectBasemap(newBasemap) {
        const oldBasemap = configService.getSync.map.selectedBasemap;

        oldBasemap.deselect();
        newBasemap.select();

        if (newBasemap.wkid !== oldBasemap.wkid) {
            // cast the current center point into the new projection
            // it will be encoded in the bookmark, so there is no need to do the calculation when the bookmark is loaded
            const startPoint = mapService.getCenterPointInTargetBasemap(
                configService.getSync.map.instance,
                oldBasemap,
                newBasemap);

            // since the map will be reloaded after this point, and the newBasempa will be selected as part of the map contstruction process
            // there is no need to broadcast events or set attribtion
            reloadService.changeProjection(startPoint);
        } else {
            geoService.map.selectBasemap(newBasemap.id);
            events.$broadcast(events.rvBasemapChange);

            mapService.setAttribution(newBasemap);
        }
    }
}
