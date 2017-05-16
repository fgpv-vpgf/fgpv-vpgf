const templateUrl = require('./toolbox.html');

/**
 * @ngdoc directive
 * @module app.ui.rvToolbox
 * @restrict E
 * @description
 *
 * The `rvToolbox` directive wraps the toolbox content for the main panel.
 *
 */
angular
    .module('app.ui')
    .directive('rvToolbox', rvToolbox);

function rvToolbox() {
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

function Controller() {

    activate();

    function activate() {

    }
}
