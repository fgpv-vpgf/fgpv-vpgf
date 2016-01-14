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
                label: 'Zoom in',
                icon: 'content:add',
                tooltip: 'Zoom in',
                action: () => geoService.shiftZoom(1)
            },
            slider: {
                // TODO: add slider properties when we find a suitable slider lib
            },
            zoomOut: {
                label: 'Zoom out',
                icon: 'content:remove',
                tooltip: 'Zoom out',
                action: () => geoService.shiftZoom(-1)
            },
            geoLocation: {
                label: 'Your Location',
                icon: 'maps:my_location',
                tooltip: 'Your Location',
                action: function () {} // FIXME: user proper call
            },
            marquee: {
                label: '???',
                icon: 'action:search',
                tooltip: '???',
                action: function () {} // FIXME: user proper call
            },
            home: {
                label: 'Canada',
                icon: 'action:home',
                tooltip: 'Canada',
                action: function () {} // FIXME: user proper call
            },
            history: {
                label: 'History',
                icon: 'action:history',
                tooltip: 'History',
                action: function () {} // FIXME: user proper call
            },
            basemap: {
                label: 'Basemap',
                icon: 'maps:map',
                tooltip: 'Basemap',

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

        return service;

        ///////////////
    }
})();
