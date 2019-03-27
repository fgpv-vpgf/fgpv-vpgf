const templateUrl = require('./appbar.html');

/**
 * @module rvAppbar
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvAppbar` directive wraps and adds functionality to the menu buttons.
 *
 */
angular
    .module('app.ui')
    .directive('rvAppbar', rvAppbar);

/**
 * `rvAppbar` directive body.
 *
 * @function rvAppbar
 * @return {object} directive body
 */
function rvAppbar(referenceService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        link: link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    function link(scope, el) {
        referenceService.panels.sidePanel = el;
    }

    return directive;
}

function Controller(sideNavigationService, stateManager, debounceService, basemapService, geosearchService,
    configService, events) {
    'ngInject';

    const self = this;
    self.sideNavigationService = sideNavigationService;
    self.stateManager = stateManager;

    self.toggleDetails = toggleDetails;
    self.toggleToc = toggleTocBuilder();
    self.openBasemapSelector = basemapService.open;
    self.toggleGeosearch = geosearchService.toggle;

    self.geosearchService = geosearchService;

    configService.onEveryConfigLoad(cfg =>
        (self.config = cfg));

    events.$on(events.rvApiMapAdded, (_, api) => {
        self._mApi = api;
    });

    function toggleDetails() {
        self._mApi.panels.details.toggle();
    }

    function toggleTocBuilder() {
        // debounce the toggle toc button to avoid wierd behaviour
        return debounceService.registerDebounce(() => {
            self._mApi.panels.legend.toggle();
        }, 300);
    }
}
