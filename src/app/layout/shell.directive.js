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

    function rvShell($rootElement, $rootScope, events, storageService, stateManager, configService, layoutService) {

        const directive = {
            restrict: 'E',
            templateUrl: 'app/layout/shell.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        let elemWidth; // last known width of the $rootElement

        return directive;

        function link(scope, el) {

            elemWidth = $rootElement.width();
            updateClass(); // first run update

            // performance optimization - only update dom if the $rootElement width has changed
            // TODO: to further improve performance only have one listener regardless of the number of viewers on the page
            $(window).on('resize', () => $rootElement.width() !== elemWidth ? updateClass() : null);

            // open legend panel if option is set in config for current viewport
            configService.getCurrent().then(config => {
                if (config.legendIsOpen && config.legendIsOpen[layoutService.currentLayout()]) {
                    stateManager.setActive({ side: false }, 'mainToc');
                }
            });

            storageService.panels.shell = el;

            // fix for IE 11 where focus can move to esri generated svg elements
            $rootScope.$on(events.rvApiReady, () => {
                $rootElement.find('.rv-esri-map svg').attr('focusable', false);
            });

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

        /**
        * Updates the $rootElement class with rv-small, rv-medium, or rv-large depending on its width
        * @function  updateClass
        */
        function updateClass() {
            elemWidth = $rootElement.width();
            $rootElement
                .removeClass('rv-small rv-medium rv-large')
                .addClass('rv-' + layoutService.currentLayout());
        }
    }

    function Controller($translate, geoService) {
        'ngInject';
        const self = this;

        self.geoService = geoService;
        self.translate = tag => $translate.instant('focus.dialog.' + tag);
    }
})();
