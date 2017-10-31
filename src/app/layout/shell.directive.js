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

function rvShell($rootElement, $rootScope, events, stateManager, configService, layoutService, referenceService,
    mapToolService, debounceService, geoService) {

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

    return directive;

    function link(scope, el) {

        // open legend panel if option is set in config for current viewport
        configService.onEveryConfigLoad(config => {
            if (config.ui.legend.isOpen[layoutService.currentLayout()]) {
                stateManager.setActive({ side: false }, 'mainToc');
            }
            scope.self.config = config;
        });

        referenceService.panels.shell = el;

        // fix for IE 11 where focus can move to esri generated svg elements
        $rootScope.$on(events.rvApiReady, () => {
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
                } else {
                    el.find('.rv-map-coordinates').remove();    // mouseInfo disabled, remove element from DOM
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

            // when switching from a sample with mouseInfo enabled to one with it disabled, this function is still called
            // coordElem is not a valid element though
            if (coordElem.length > 0) {
                coordElem[0].innerText = coords[0];
                coordElem[1].innerText = coords[1];
            }
        }

        // set a resize listener on the root element to update it's layout styling based on the changed size
        _updateShallLayoutClass();
        referenceService.onResize($rootElement,
            debounceService.registerDebounce(_updateShallLayoutClass, 350, false));

        // FIXME: remove; opens the main panel for easier dev work
        // stateManager.setActive({ side: false }, 'mainLoaderService');
        // stateManager.setActive({ side: false }, 'mainLoaderFile');
        // stateManager.setActive({ side: false }, { mainToc: true });

        /**
         * Updates the $rootElement class with rv-small, rv-medium, or rv-large depending on its width and height.
         *
         * @function  updateClass
         * @param {Object} newD new dimensions in the form of { width: <Number>, height: <Number> }
         * @param {Object} oldD old dimensions in the form of { width: <Number>, height: <Number> }
         */
        function _updateShallLayoutClass(newD, oldD) {
            // the first time the watch is triggered, newD is undefined
            if (!newD) {
                return;
            }

            // if dimensions are 0, something is wrong (I'm looking at you, IE)
            // this happens in IE when switching to full screen; just ignore
            if (newD.width === 0 || newD.height === 0) {
                return;
            }

            $rootElement
                .removeClass('rv-small rv-medium rv-large')
                .addClass('rv-' + layoutService.currentLayout())
                .toggleClass('rv-short', layoutService.isShort());
        }
    }
}

function Controller(geoService) {
    'ngInject';
    const self = this;

    self.geoService = geoService;
}
