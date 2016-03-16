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
    function mapNavigationService(stateManager, geoService) {
        const service = {
            // FIXME: this config snippet should obvisouly come from config service
            config: {
                zoom: 'buttons', // 'all', 'slider', 'buttons'
                extra: [
                    // 'geoLocation',
                    // 'marquee',
                    'home',
                    // 'history',
                    'basemap'
                ]
            },
            controls: {}
        };

        // navigation controls presets
        service.controls = {
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
            geoLocation: {
                label: 'nav.label.geoLocation',
                icon: 'maps:my_location',
                tooltip: 'nav.tooltip.geoLocation',
                action: function () {} // FIXME: user proper call
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
            basemap: {
                label: 'nav.label.basemap',
                icon: 'maps:map',
                tooltip: 'nav.tooltip.basemap',

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
    }
})();
