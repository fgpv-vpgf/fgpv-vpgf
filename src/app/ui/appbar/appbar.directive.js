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
    configService, events, $translate) {
    'ngInject';

    const self = this;
    self.sideNavigationService = sideNavigationService;
    self.stateManager = stateManager;

    self.toggleDetails = toggleDetails;
    self.toggleToc = toggleTocBuilder();
    self.openBasemapSelector = basemapService.open;
    self.toggleGeosearch = geosearchService.toggle;
    self.title = '';

    self.geosearchService = geosearchService;

    configService.onEveryConfigLoad(cfg =>
        (self.config = cfg));

    let requester;
    events.$on(events.rvApiPreMapAdded, (_, api) => {
        configService.getSync.map.instance.setAppbarTitle = (panel, title) => {
            requester = panel;
            self.title = $translate.instant(title);
        }
        configService.getSync.map.instance.releaseAppbarTitle = (panel) => {
            if (requester === panel) {
                self.title = '';
            }
        }
        self.panelRegistry = api.panels;
    });

    function toggleDetails() {
        self._mApi.panels.details.toggle();
    }

    function toggleTocBuilder() {
        // debounce the toggle toc button to avoid wierd behaviour
        return debounceService.registerDebounce(() => {
            self.panelRegistry.legend.toggle();
        }, 300);
    }
}
