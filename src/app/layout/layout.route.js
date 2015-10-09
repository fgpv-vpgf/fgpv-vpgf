(function () {
    'use strict';

    
    angular
        .module('app.layout')
        .run(layoutConfig);

    /* @ngInject */


    /**
     * 
     * @name app.layout#layoutConfig
     * @module app.layout
     * @description
     *
     * The `layoutConfig` run block sets the layout states and triggers the `app` state which is the default state upon app loading.
     */
    function layoutConfig(statehelper, templateRegistry, viewRegistry, $state) {
        statehelper.configureStates(getStates());

        // when layout is ready, go to the default state
        $state.go('app');

        //$state.go('app', {}, {location: true}); // will change the url;
        // http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$state#methods_go
        // need to detect if it's a single-page app or multiple apps

        ////////////////

        /**
         * Returns collection of state objects for layout module.
         * @return {array} A collection of state objects for UI-router
         */
        function getStates() {
            // TODO: move toc and toolbox parts to the corresponding modules
            return [
                {
                    name: 'app',
                    config: {
                        url: '/',
                        views: {
                            appbarPlug: {
                                templateUrl: templateRegistry.appbar
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
                        abstract: true,
                        views: viewRegistry.panelPlug
                    }
                },
                {
                    name: 'app.main.toc',
                    config: {
                        url: 'toc',
                        views: {
                            contentPlug: {
                                templateUrl: templateRegistry.toc
                            }
                        }
                    }
                },
                {
                    name: 'app.main.toc.side',
                    config: {
                        abstract: true,
                        views: viewRegistry.sidePanelPlug
                    }
                },
                {
                    name: 'app.main.toc.side.metadata',
                    config: {
                        url: 'metadata',
                        views: {
                            contentPlug: {
                                templateUrl: templateRegistry.metadata
                            }
                        }
                    }
                },
                {
                    name: 'app.main.toc.side.settings',
                    config: {
                        url: 'settings',
                        views: {
                            contentPlug: {
                                templateUrl: templateRegistry.settings
                            }
                        }
                    }
                },
                {
                    name: 'app.main.toolbox',
                    config: {
                        url: 'toolbox',
                        views: {
                            contentPlug: {
                                templateUrl: templateRegistry.toolbox
                            }
                        }
                    }
                }
            ];
        }
    }
})();
