(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMenuLink
     * @module app.ui.sidenav
     * @description
     *
     * The `rvMenuLink` directive is a wrapper around a button to provide some extra functionality (highlight currently selected item for example).
     */
    angular
        .module('app.ui.sidenav')
        .directive('rvMenuLink', rvMenuLink);

    function rvMenuLink() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/ui/sidenav/menulink.html',
            scope: {
                section: '='
            },
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function linkFunc(scope, el, attr, ctrl) {
            console.log(scope, el, attr, ctrl);
        }
    }

    /* @ngInject */
    function Controller() {
        var self = this;
        console.log('--', self.section);

        activate();

        ////////////////

        function activate() {

        }
    }
})();
