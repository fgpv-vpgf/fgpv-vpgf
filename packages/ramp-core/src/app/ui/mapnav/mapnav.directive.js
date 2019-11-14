const templateUrl = require('./mapnav.html');

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
    .module('app.ui')
    .directive('rvMapnav', rvMapnav);

function rvMapnav() {
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

function Controller(configService) {
    'ngInject';
    const self = this;

    // expose navbar config to the template
    configService.onEveryConfigLoad(config =>
        (self.config = config.ui.navBar));
}
