(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvShell
     * @module app.layout
     * @restrict E
     * @description
     *
     * // TODO: update comments since it's a directive now and much had changed.
     * The `ShellController` controller handles the shell which is the visible part of the layout.
     * `self.isLoading` is initially `true` and causes the loading overlay to be displayed; when `configService` resolves, it's set to `false` and the loading overly is removed.
     */
    angular
        .module('app.layout')
        .directive('rvShell', rvShell);

    function rvShell(storageService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/layout/shell.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /********/

        function link(scope, el) { // , attr, ctrl) {
            storageService.panels.shell = el;
        }
    }

    // TODO: clean; there is a lot of garbage/demo code here
    function Controller($mdDialog, $http, version, stateManager, sideNavigationService, geoService, fullScreenService) {
        'ngInject';
        const self = this;

        self.geoService = geoService;

        self.version = version;

        /***/

        self.loaderFile = loaderFile;

        // TODO: mock settings; replace by config
        self.menu = [{
                name: 'Options',
                type: 'heading',
                children: [{
                        name: 'Full Screen',
                        type: 'link',
                        action: () => {
                            sideNavigationService.close();
                            fullScreenService.toggle();
                        }
                    }, {
                        name: 'Share',
                        type: 'link'
                    }
                    /*, // TODO: re-enable if map-export functionality ever exists
                    {
                        name: 'Print',
                        type: 'link'
                    }*/
                ]
            },
            /*{ // TODO: re-enable if needed in the future
                name: 'About',
                type: 'link'
            },*/
            {
                name: 'Help',
                type: 'link',
                action: event => {
                    sideNavigationService.close();

                    // TODO: do something better
                    // open dumb help
                    $mdDialog.show({
                        controller: HelpSummaryController,
                        controllerAs: 'self',
                        templateUrl: 'app/ui/help/help-summary.html',
                        parent: angular.element('.fgpv'),
                        targetEvent: event,
                        clickOutsideToClose: true,
                        fullscreen: false
                    });

                    // stateManager.setActive('help');
                    // console.log('Halp!');
                }
            }
        ];

        /***/

        /**************/

        function HelpSummaryController() {
            const self = this;
            self.closeHelpSummary = () => $mdDialog.hide();

            $http.get(`locales/en-CA/translation.json`).then(data => {
                self.sections = Object.keys(data.data.help);
            });

            console.log(self);
        }

        // TODO: hack
        function loaderFile() {
            stateManager.setActive('mainLoaderFile');
        }
    }
})();
