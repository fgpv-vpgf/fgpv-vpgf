(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvToolbox
     * @module app.ui.toolbox
     * @restrict E
     * @description
     *
     * The `rvToolbox` directive wraps the toolbox content for the main panel.
     *
     */
    angular
        .module('app.ui.toolbox')
        .directive('rvToolbox', rvToolbox);

    function rvToolbox() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toolbox/toolbox.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller() {
        //var self = this;

        activate();

        function activate() {

        }
    }
})();
