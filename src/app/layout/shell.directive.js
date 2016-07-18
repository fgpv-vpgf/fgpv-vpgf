(() => {
    'use strict';

    /**
     * @module rvShell
     * @memberof app.layout
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

    function rvShell(storageService, stateManager, $rootElement) {
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

        function link(scope, el) {
            storageService.panels.shell = el;

            // close all panels when escape key is pressed
            $rootElement.on('keydown', event => {
                if (event.which === 27) {
                    scope.$apply(() => {
                        stateManager.closePanelFromHistory();
                    });
                } else if ([9, 13, 37, 38, 39, 40, 187, 189].find(x => x === event.which)) {
                    $rootElement.addClass('keyboard');
                    $rootElement.on('mousemove', () => {
                        $rootElement.removeClass('keyboard');
                        $rootElement.off('mousemove');
                    });
                }
            });
        }
    }

    function Controller($rootElement, $mdDialog, version, sideNavigationService, geoService, fullScreenService,
        helpService, configService, storageService) {
        'ngInject';
        const self = this;

        self.geoService = geoService;
        self.version = version;
        self.minimize = sideNavigationService.close;

        configService.getCurrent().then(data => {
            self.markerImageSrc = data.logoUrl;
        });

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
                ]
            },
            {
                name: 'Help',
                type: 'link',
                action: event => {
                    sideNavigationService.close();

                    $mdDialog.show({
                        controller: helpService.HelpSummaryController,
                        controllerAs: 'self',
                        templateUrl: 'app/ui/help/help-summary.html',
                        parent: storageService.panels.shell,
                        disableParentScroll: false,
                        targetEvent: event,
                        clickOutsideToClose: true,
                        fullscreen: false
                    });
                }
            }
        ];
    }
})();
