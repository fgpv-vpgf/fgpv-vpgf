(function () {
    'use strict';

    angular
        .module('app.ui.panels')
        .directive('rvContentPane', rvContentPane);

    /* @ngInject */
    function rvContentPane() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/ui/panels/content-pane.html',
            scope: {
                title: '@'
            },
            transclude: true,
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function linkFunc(/*scope, el, attr, ctrl*/) {

        }
    }

    /* @ngInject */
    function Controller() {

        //var self = this;

        activate();

        function activate() {

        }
    }
})();
