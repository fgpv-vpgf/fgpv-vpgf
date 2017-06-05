const templateUrl = require('./shell.html');

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

function rvShell($rootElement, $rootScope, events, storageService, stateManager, configService, layoutService,
    mapToolService, debounceService, geoService, $mdDialog) {

    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    let outMouseSR;

    let elemWidth; // last known width of the $rootElement
    let elemHeight; // last known height of the $rootElement

    return directive;

    function link(scope, el) {

        elemWidth = $rootElement.width();
        elemHeight = $rootElement.height();
        updateClass(); // first run update

        // performance optimization - only update dom if the $rootElement width has changed
        // TODO: to further improve performance only have one listener regardless of the number of viewers on the page
        $(window).on('resize', () => $rootElement.width() !== elemWidth || $rootElement.height() !== elemHeight ? updateClass() : null);

        // open legend panel if option is set in config for current viewport
        configService.onEveryConfigLoad(config => {
            if (config.ui.legendIsOpen && config.ui.legendIsOpen[layoutService.currentLayout()]) {
                stateManager.setActive({ side: false }, 'mainToc');
            }
            scope.self.map = config.map;
        });

        storageService.panels.shell = el;

        // fix for IE 11 where focus can move to esri generated svg elements
        $rootScope.$on(events.rvApiReady, () => {
            RV.focusManager.addViewer($rootElement, $mdDialog, configService.getSync.ui.fullscreen);
            $rootElement.find('.rv-esri-map svg').attr('focusable', false);

            configService.getAsync.then(config => {
                const mapConfig = config.map.components;
                if (mapConfig.mouseInfo.enabled) {
                    // set ouput spatial reference for mouse coordinates. If spatial reference is defined in configuration file
                    // use it. If not, use the basemap spatial reference
                    const sr = mapConfig.mouseInfo.spatialReference;
                    outMouseSR = (typeof sr !== 'undefined') ? sr.wkid : geoService.mapObject.spatialReference;

                    // set map coordinates
                    $rootScope.$on('rvMouseMove',
                        debounceService.registerDebounce(updateMapCoordinates, 100, false));
                }
            });
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

        /**
        * Displays map coordinates on map
        * @function  updateMapCoordinates
        * @param {Object} evt mouse mouve events
        * @param {Object} point point to show coordinates for
        */
        function updateMapCoordinates(evt, point) {
            const coords = mapToolService.mapCoordinates(point, outMouseSR);
            const coordElem = el.find('.rv-map-coordinates span');
            coordElem[0].innerText = coords[0];
            coordElem[1].innerText = coords[1];
        }

        // TODO: remove; opens the main panel for easier dev work
        // stateManager.setActive({ side: false }, 'mainLoaderService');
        // stateManager.setActive({ side: false }, 'mainLoaderFile');
        stateManager.setActive({ side: false }, { mainToc: true });
    }

    /**
    * Updates the $rootElement class with rv-small, rv-medium, or rv-large depending on its width
    * @function  updateClass
    */
    function updateClass() {
        elemWidth = $rootElement.width();
        elemHeight = $rootElement.height();
        $rootElement
            .removeClass('rv-small rv-medium rv-large')
            .addClass('rv-' + layoutService.currentLayout());
        $rootElement.toggleClass('rv-short', layoutService.isShort());
    }
}

function Controller($translate, geoService, configService) {
    'ngInject';
    const self = this;

    self.geoService = geoService;
    self.configService = configService; // TODO: fix when config service can fire events
    self.translate = tag => $translate.instant('focus.dialog.' + tag);
}
