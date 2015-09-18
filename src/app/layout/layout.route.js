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
        //$state.go('app', {}, {location: true}); // will change the url;
        // http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$state#methods_go
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
                            /*panelPlug: {
                                template: '<div>panel placeholder' +
                                    '<a href="">example of a link</a></div>'
                            },*/
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
                    name: 'app.main',
                    config: {
                        /*resolve: {

                        }*/
                        abstract: true,
                        views: {
                            'panelPlug@': {
                                templateUrl: templateRegistry.mainPanel,
                                controller: function ($scope) {
                                    $scope.active = function () {
                                        return true;
                                    };
                                }
                            }
                        }
                    }
                },
                {
                    name: 'app.main.sets',
                    config: {
                        url: 'sets',
                        views: {
                            contentPlug: {
                                template: '<div>This is sets panel content</div>'
                            }
                        }
                    }
                },
                {
                    name: 'app.main.tools',
                    config: {
                        url: 'tools',
                        views: {
                            contentPlug: {
                                template: '<div>This is tools panel content. I said TOO00Ls!</div>'
                            }
                        }
                    }
                }
            ];
        }
    }
})();
