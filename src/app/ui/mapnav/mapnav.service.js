(() => {
    'use strict';

    const MAPNAV_CONFIG_DEFAULT = {
        zoom: 'buttons', // 'all', 'slider', 'buttons'
        extra: [
            // NOTE: marquee and history buttons kept as options for future functionality
            // possible values
            // 'geoLocation',
            // 'marquee',
            // 'home',
            // 'history',
            // 'basemap'
            // 'help'
        ]
    };

    /**
     * @module mapNavigationService
     * @memberof app.ui
     *
     * @description
     * The `mapNavigationService` service provides access to map navgiation compoent's actions like `zoom`, `geolocation`, `full extent` and `history extent`.
     *
     */
    angular
        .module('app.ui.mapnav')
        .factory('mapNavigationService', mapNavigationService);

    /**
     * `mapNavigationService` exposes zoom and pan methods as well as controls available in the map navigation component.
     *
     * @function mapNavigationService
     * @private
     * @return {object} service object
     */
    function mapNavigationService(stateManager, geoService, $rootScope, locateService,
    helpService, basemapService, events, configService, fullScreenService) {

        const service = {
            config: {},
            controls: {}
        };

        init();

        // navigation controls presets
        service.controls = {
            fullScreen: {
                label: 'sidenav.label.fullscreen',
                icon: 'navigation:fullscreen',
                tooltip: 'sidenav.label.fullscreen',
                visible: !fullScreenService.isFullPageApp,
                action: fullScreenService.toggle
            },
            zoomIn: {
                label: 'nav.label.zoomIn',
                icon: 'content:add',
                tooltip: 'nav.tooltip.zoomIn',
                action: () => geoService.shiftZoom(1)
            },
            slider: {
                // TODO: add slider properties when we find a suitable slider lib
            },
            zoomOut: {
                label: 'nav.label.zoomOut',
                icon: 'content:remove',
                tooltip: 'nav.tooltip.zoomOut',
                action: () => geoService.shiftZoom(-1)
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
            history: {
                label: 'nav.label.history',
                icon: 'action:history',
                tooltip: 'nav.tooltip.history',
                action: function () {} // FIXME: user proper call
            },
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

        /*************/

        /**
         * Set up initial mapnav cluster buttons.
         * Set up language change listener to update the buttons when a new config is loaded.
         *
         * @function init
         * @private
         */
        function init() {
            setupMapnavButtons();

            // if language change, reset menu item
            $rootScope.$on(events.rvLangSwitch, setupMapnavButtons);
        }

        /**
         * Merges a mapnav snippet from the config file with the default configuration. This is a shallow extend and the top-level properties (`extra` and `button` will be overwritten). Supplying an empty array as `extra` will remove all the extra buttons from the cluster.
         *
         * @function setupMapnavButtons
         * @function private
         */
        function setupMapnavButtons() {
            configService.getCurrent().then(data =>
                    angular.extend(service.config, MAPNAV_CONFIG_DEFAULT, data.navBar));
        }
    }
})();
