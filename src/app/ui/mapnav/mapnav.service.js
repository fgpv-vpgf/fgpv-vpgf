(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name mapNavigationService
     * @module app.ui.mapnav
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
     * @return {object} service object
     */
    function mapNavigationService(stateManager, geoService, $translate) {
        const service = {
            // FIXME: this config snippet should obvisouly come from config service
            config: {
                zoom: 'buttons', // 'all', 'slider', 'buttons'
                extra: [
                    'geoLocation',
                    'marquee',
                    'home',
                    'history',
                    'basemap'
                ]
            },
            controls: {}
        };

        // navigation controls presets
        service.controls = {
            zoomIn: {
                label: '',
                icon: 'content:add',
                tooltip: '',
                action: () => geoService.shiftZoom(1)
            },
            slider: {
                // TODO: add slider properties when we find a suitable slider lib
            },
            zoomOut: {
                label: '',
                icon: 'content:remove',
                tooltip: '',
                action: () => geoService.shiftZoom(-1)
            },
            geoLocation: {
                label: '',
                icon: 'maps:my_location',
                tooltip: '',
                action: function () {} // FIXME: user proper call
            },
            marquee: {
                label: '',
                icon: 'action:search',
                tooltip: '',
                action: function () {} // FIXME: user proper call
            },
            home: {
                label: '',
                icon: 'action:home',
                tooltip: '',
                action: () => geoService.setFullExtent()
            },
            history: {
                label: '',
                icon: 'action:history',
                tooltip: '',
                action: function () {} // FIXME: user proper call
            },
            basemap: {
                label: '',
                icon: 'maps:map',
                tooltip: '',

                // TODO: revise how mode is detected
                selected: () => stateManager.state.mapnav.morph !== 'default',
                action: () => {
                    // TODO: revise
                    stateManager.setActive('otherBasemap');

                    let newMode = stateManager.state.mapnav.morph === 'default' ?
                        'basemap' : 'default';
                    stateManager.setMorph('mapnav', newMode);
                }
            }
        };

        $translate.onReady(() => {
            service.controls.zoomIn.tooltip = $translate.instant('nav.tooltip.zoomIn');
            service.controls.zoomIn.label = $translate.instant('nav.label.zoomIn');

            service.controls.zoomOut.tooltip = $translate.instant('nav.tooltip.zoomOut');
            service.controls.zoomOut.label = $translate.instant('nav.label.zoomOut');

            service.controls.geoLocation.tooltip = $translate.instant('nav.tooltip.geoLocation');
            service.controls.geoLocation.label = $translate.instant('nav.label.geoLocation');

            service.controls.marquee.tooltip = $translate.instant('nav.tooltip.search');
            service.controls.marquee.label = $translate.instant('nav.label.search');

            service.controls.home.tooltip = $translate.instant('nav.tooltip.home');
            service.controls.home.label = $translate.instant('nav.label.home');

            service.controls.history.tooltip = $translate.instant('nav.tooltip.history');
            service.controls.history.label = $translate.instant('nav.label.history');

            service.controls.basemap.tooltip = $translate.instant('nav.tooltip.basemap');
            service.controls.basemap.label = $translate.instant('nav.label.basemap');
        });

        return service;

        ///////////////
    }
})();
