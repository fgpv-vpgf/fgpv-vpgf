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
    configService, geoSearch) {
    'ngInject';

    const self = this;
    self.sideNavigationService = sideNavigationService;
    self.stateManager = stateManager;

    self.toggleDetails = toggleDetails;
    self.toggleToc = toggleTocBuilder();
    self.toggleToolbox = toggleToolbox;
    self.openBasemapSelector = basemapService.open;
    self.toggleGeosearch = geosearchService.toggle;

    self.geoSearch = geoSearch;

    configService.onEveryConfigLoad(cfg =>
        (self.config = cfg));

    function toggleDetails() {
        stateManager.setActive({ side: false }, 'mainDetails');
    }

    function toggleTocBuilder() {
        // debounce the toggle toc button to avoid wierd behaviour
        return debounceService.registerDebounce(() => {
            stateManager.setActive({ side: false }, 'mainToc');
        });
    }

    function toggleToolbox() {
        stateManager.setActive({ side: false }, 'mainToolbox');
    }
}
