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

    function rvShell(storageService, stateManager, $rootElement, events, $rootScope) {
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

            // fix for IE 11 where focus can move to esri generated svg elements
            $rootScope.$on(events.rvApiReady, () => {
                $rootElement.find('.rv-esri-map svg').attr('focusable', false);
            });

            // close all panels when escape key is pressed
            $rootElement.on('keydown', event => {
                // detect if any side panels are open, if so ignore escape key (side panel has own listener and will continue to close)
                const mdSidePanelOpen = $('md-sidenav').toArray().find(el => !$(el).hasClass('md-closed'));
                if (event.which === 27 && !mdSidePanelOpen) {
                    scope.$apply(() => {
                        stateManager.closePanelFromHistory();
                    });
                } else if ([9, 13, 37, 38, 39, 40, 187, 189].find(x => x === event.which)) {
                    $rootElement.addClass('rv-keyboard');
                    $rootElement.on('mousemove', () => {
                        $rootElement.removeClass('rv-keyboard');
                        $rootElement.off('mousemove');
                    });
                }
            });
        }
    }

    function Controller($mdDialog, $translate, version, sideNavigationService, geoService,
        fullScreenService, helpService, configService, storageService, exportService) {
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
                        name: $translate.instant('sidenav.label.fullscreen'),
                        type: 'link',
                        action: () => {
                            sideNavigationService.close();
                            fullScreenService.toggle();
                        }
                    },
                    {
                        name: $translate.instant('sidenav.label.export'),
                        type: 'link',
                        action: () => {
                            sideNavigationService.close();
                            exportService.open();
                        }
                    }/*, {
                        name: $translate.instant('sidenav.label.share'),
                        type: 'link'
                    }*/
                ]
            },
            {
                name: $translate.instant('sidenav.label.help'),
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
