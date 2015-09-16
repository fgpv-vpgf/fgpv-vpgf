(function () {
    'use strict';

    angular
        .module('app.layout')
        .run(layoutConfig);

    /* @ngInject */
    function layoutConfig(statehelper, templateRegistry, $state) {
        statehelper.configureStates(getStates());

        // when layout is ready, go to the default state
        $state.go('app');
        //$state.go('app', {location: true}); // will change the url;
        // need to detect if it's a single-page app or multiple apps

        ////////////////

        function getStates() {
            return [
                {
                    name: 'app',
                    config: {
                        url: '/',
                        views: {
                            toolbarPlug: {
                                templateUrl: templateRegistry.toolbar
                            },
                            panelPlug: {
                                template: '<div>panel placeholder' +
                                    '<a href="">example of a link</a></div>'
                            },
                            detailsPlug: {
                                template: '<div>details panel placeholder</div>'
                            },
                            geoSearchPlug: {
                                template: '<div>geosearch placeholder</div>'
                            }
                        }
                    }
                },
                {
                    name: 'app.details',
                    config: {
                        url: 'details',
                        views: {
                            'detailsPlug@': {
                                template: '<div>details panel with content</div>'
                            }
                        }
                    }
                }
            ];
        }
    }
})();
