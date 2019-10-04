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
        referenceService.panels.appBar = el;
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

    let requesterStack = [];
    events.$on(events.rvApiPreMapAdded, (_, api) => {
        configService.getSync.map.instance.setAppbarTitle = (requester, title) => {
            // push change onto stack
            requesterStack.unshift({ requester, title });
            updateTitle(title);
        }
        configService.getSync.map.instance.releaseAppbarTitle = requester => {
            // if this requester made the last change then clear the title
            if (requesterStack[0] && requesterStack[0].requester === requester) {
                updateTitle('');
            }

            // remove anything from this requester from the stack
            requesterStack = requesterStack.filter(oldRequester => oldRequester.requester !== requester);

            // if theres something left on the stack update the title
            if (requesterStack.length > 0) {
                updateTitle(requesterStack[0].title);
            }
        }
        self.panelRegistry = api.panels;
    });

    function updateTitle(title) {
        self.title = $translate.instant(title);
    }

    function toggleDetails() {
        self.panelRegistry.details.toggle();
    }

    function toggleTocBuilder() {
        // debounce the toggle toc button to avoid wierd behaviour
        return debounceService.registerDebounce(() => {
            self.panelRegistry.legend.toggle();
        }, 300);
    }
}
