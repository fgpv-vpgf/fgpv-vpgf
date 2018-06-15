const templateUrl = require('./basemap.html');

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
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(geoService, mapService, basemapService, configService, events, reloadService, ConfigObject, $rootScope) {
    'ngInject';
    const self = this;

    configService.onEveryConfigLoad(config =>
        (self.map = config.map));

    self.geoService = geoService;

    self.close = basemapService.close;
    self.selectBasemap = selectBasemap;

    self.notifyApiClick = notifyApiClick;

    let mApi = null;
    events.$on(events.rvApiMapAdded, (_, api) => { mApi = api});

    // wire in a hook to any map for changing a basemap using id. this makes it available on the API
    // also wire in a hook for adding / removing a basemap from the available list
    events.$on(events.rvMapLoaded, () => {
        const mapConfig = configService.getSync.map;
        const allBasemaps = mapConfig.basemaps;

        mapConfig.instance.changeBasemap = id => {
            const newBasemap = allBasemaps.find(basemap => basemap.id === id);
            self.selectBasemap(newBasemap);
        };

        mapConfig.instance.deleteBasemap = apiBasemap => {
            const id = apiBasemap.id;
            const index = allBasemaps.findIndex(basemap => basemap.id === id);
            const basemapToDelete = allBasemaps[index];
            if (apiBasemap.isActive) {
                let newBasemap = allBasemaps.find(basemap => basemap.id !== id && basemap.wkid === basemapToDelete.wkid);
                if (!newBasemap) {
                    newBasemap = allBasemaps.find(basemap => basemap.id !== id);
                }
                self.selectBasemap(newBasemap);
            }
            allBasemaps.splice(index, 1);
            mapConfig.instance.removeBasemap(basemapToDelete);
            $rootScope.$applyAsync();
        };

        mapConfig.instance.appendBasemap = JSONSnippet => {
            const tileSchema = mapConfig.tileSchemas.find(tileSchema =>
                tileSchema.id === JSONSnippet.tileSchemaId);

            const basemap = new ConfigObject.Basemap(JSONSnippet, tileSchema);

            mapConfig.basemaps.push(basemap);
            mapConfig.instance.addBasemap(JSONSnippet);
            $rootScope.$applyAsync();
        }
    });

    return;

    /**
     * Change the the current basemap to the selected one.
     * This will change the projection and trigger map reload if the selected basemap in a different projection.
     *
     * @function selectBasemap
     * @param {Basemap} newBasemap a Basemap object from the config
     */
    function selectBasemap(newBasemap) {
        const oldBasemap = configService.getSync.map.selectedBasemap;

        oldBasemap.deselect();
        newBasemap.select();

        const oldApiBasemap = mApi.ui.basemaps.getBasemapById(oldBasemap.id);
        oldApiBasemap._isActive = false;
        oldApiBasemap._activeChanged.next(false);

        if (newBasemap.wkid !== oldBasemap.wkid) {
            // cast the current center point into the new projection
            // it will be encoded in the bookmark, so there is no need to do the calculation when the bookmark is loaded
            const startPoint = mapService.getCenterPointInTargetBasemap(
                configService.getSync.map.instance,
                oldBasemap,
                newBasemap);

            // since the map will be reloaded after this point, and the newBasemap will be selected as part of the map construction process
            // there is no need to broadcast events or set attribution
            reloadService.changeProjection(startPoint);
        } else {
            geoService.map.selectBasemap(newBasemap.id);
            events.$broadcast(events.rvBasemapChange);

            mapService.setAttribution(newBasemap);
        }

        const newApiBasemap = mApi.ui.basemaps.getBasemapById(newBasemap.id);
        newApiBasemap._isActive = true;
        newApiBasemap._activeChanged.next(true);
    }

    /**
     * Triggers the API basemap group observable when a basemap is clicked in the panel
     *
     * @function notifyApiClick
     * @private
     * @param {Basemap} basemap basemap that was clicked
     */
    function notifyApiClick(basemap) {
        let apiBasemap;
        if (mApi) {
            apiBasemap = mApi.ui.basemaps.getBasemapById(basemap.id);

            if (apiBasemap) {
                mApi.ui.basemaps._click.next(apiBasemap);
            }
        }
    }
}
