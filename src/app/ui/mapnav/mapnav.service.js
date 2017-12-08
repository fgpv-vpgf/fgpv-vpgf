/**
 * @module mapNavigationService
 * @memberof app.ui
 *
 * @description
 * The `mapNavigationService` service provides access to map navgiation compoent's actions like `zoom`, `geolocation`, `full extent` and `history extent`.
 *
 */
angular
    .module('app.ui')
    .factory('mapNavigationService', mapNavigationService);

/**
 * `mapNavigationService` exposes zoom and pan methods as well as controls available in the map navigation component.
 *
 * @function mapNavigationService
 * @private
 * @return {object} service object
 */
function mapNavigationService(stateManager, geoService, $rootScope, locateService, debounceService,
    helpService, basemapService, events, fullScreenService, geosearchService, sideNavigationService) {

    const service = {
        controls: {}
    };

    // navigation controls presets
    service.controls = {
        fullscreen: {
            label: 'sidenav.label.fullscreen',
            icon: 'navigation:fullscreen',
            tooltip: 'sidenav.label.fullscreen',
            action: () => fullScreenService.toggle()
        },
        zoomIn: {
            label: 'nav.label.zoomIn',
            icon: 'content:add',
            tooltip: 'nav.tooltip.zoomIn',
            action: () => geoService.map.shiftZoom(1)
        },
        slider: {
            // TODO: add slider properties when we find a suitable slider lib
        },
        zoomOut: {
            label: 'nav.label.zoomOut',
            icon: 'content:remove',
            tooltip: 'nav.tooltip.zoomOut',
            action: () => geoService.map.shiftZoom(-1)
        },
        layers: {
            label: 'appbar.tooltip.layers',
            icon: 'maps:layers',
            tooltip: 'appbar.tooltip.layers',
            action: debounceService.registerDebounce(() => {
                stateManager.setActive({ side: false }, 'mainToc');
            })
        },
        sideMenu: {
            label: 'appbar.tooltip.menu',
            icon: 'navigation:menu',
            tooltip: 'appbar.tooltip.menu',
            action: sideNavigationService.open
        },
        geoSearch: {
            label: 'appbar.tooltip.geosearchshort',
            icon: 'action:search',
            tooltip: 'appbar.tooltip.geosearchshort',
            action: geosearchService.toggle
        },
        geoLocator: {
            label: 'nav.label.geoLocation',
            icon: 'maps:my_location',
            tooltip: 'nav.tooltip.geoLocation',
            action: locateService.find
        },
        marquee: {
            label: 'nav.label.search',
            icon: 'action:search',
            tooltip: 'nav.tooltip.search',
            action: function () {} // FIXME: user proper call
        },
        home: {
            label: 'nav.label.home',
            icon: 'action:home',
            tooltip: 'nav.tooltip.home',
            action: () => geoService.setFullExtent()
        },
        /*history: {
            label: 'nav.label.history',
            icon: 'action:history',
            tooltip: 'nav.tooltip.history',
            action: function () {} // FIXME: user proper call
        },*/
        help: {
            label: 'sidenav.label.help',
            icon: 'community:help',
            tooltip: 'sidenav.label.help',
            action: helpService.open
        },
        basemap: {
            label: 'nav.label.basemap',
            icon: 'maps:map',
            tooltip: 'nav.tooltip.basemap',

            selected: () => stateManager.state.mapnav.morph !== 'default',
            action: basemapService.open
        }
    };

    // TODO when time permits, investigate this alternate form of translation.
    //     we are currently using filters; performance testing should be done
    //     to see if they have a significant impact compared to this approach
    //     see https://github.com/fgpv-vpgf/fgpv-vpgf/commit/ac798a8a9b6678a7d37d462fd776ae54139739a4
    /*
    $translate.onReady(() => {
        service.controls.zoomIn.tooltip = $translate.instant('nav.tooltip.zoomIn');
        service.controls.zoomIn.label = $translate.instant('nav.label.zoomIn');
        ...
    });
    */

    return service;
}
