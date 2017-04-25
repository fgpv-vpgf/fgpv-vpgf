(() => {
    'use strict';

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
            templateUrl: 'app/ui/sidenav/sidenav.html',
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
            (self.config = config.ui.sideMenu));

        self.service = sideNavigationService;

        self.version = version;
    }
})();
