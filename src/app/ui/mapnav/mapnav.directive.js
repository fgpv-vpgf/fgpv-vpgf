(() => {
    'use strict';

    /**
     * @module rvMapnav
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvMapnav` directive handles the rendering of the map navigation component.
     *
     */
    angular
        .module('app.ui.mapnav')
        .directive('rvMapnav', rvMapnav);

    function rvMapnav() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/mapnav/mapnav.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(configService) {
        'ngInject';
        const self = this;

        // expose navbar config to the template
        configService.onEveryConfigLoad(config =>
            (self.config = config.ui.navBar));
    }
})();
