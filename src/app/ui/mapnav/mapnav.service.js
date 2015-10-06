(function () {
    'use strict';

    angular
        .module('app.ui.mapnav')
        .factory('mapNavigationService', mapNavigationService);

    /* @ngInject */
    function mapNavigationService() {
        const service = {
            // FIXME: `enabled` flags should come from the config file
            controls: {
                zoomIn: {
                    enabled: true,
                    name: 'Zoom in',
                    icon: 'add',
                    tooltip: 'Zoom in',
                    call: function (data) {
                        console.log(data);
                    }
                },
                slider: {
                    enabled: false
                },
                zoomOut: {
                    enabled: true,
                    name: 'Zoom out',
                    icon: 'remove',
                    tooltip: 'Zoom out'
                },
                geoLocation: {
                    enabled: true,
                    name: 'Your Location',
                    icon: 'my_location',
                    tooltip: 'Your Location'
                },
                marquee: {
                    enabled: true,
                    name: '???',
                    icon: 'search',
                    tooltip: '???'
                },
                home: {
                    enabled: true,
                    name: 'Canada',
                    icon: 'home',
                    tooltip: 'Canada'
                },
                history: {
                    enabled: true,
                    name: 'History',
                    icon: 'history',
                    tooltip: 'History'
                }
            }
        };

        return service;
    }
})();
