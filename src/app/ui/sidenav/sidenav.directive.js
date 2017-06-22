const templateUrl = require('./sidenav.html');

/**
 * @module rvSidenav
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvSidenav` directive displays a basemap selector. Its template uses a content pane which is loaded into the `other` panel opening on the right side of the screen. Selector groups basemaps by projection.
 *
 */
angular
    .module('app.ui')
    .directive('rvSidenav', rvSidenav);

function rvSidenav() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(sideNavigationService, version, configService) {
    'ngInject';
    const self = this;

    // expose sidemenu config to the template
    configService.onEveryConfigLoad(config =>
        (self.uiConfig = config.ui));

    self.service = sideNavigationService;

    self.version = version;
}
