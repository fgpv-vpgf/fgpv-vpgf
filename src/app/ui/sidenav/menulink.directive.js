(function () {
    'use strict';

    angular
        .module('app.ui')
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
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        function linkFunc(scope, el, attr, ctrl) {
            console.log(scope, el, attr, ctrl);
        }
    }

    Controller.$inject = [];

    function Controller() {
        var vm = this;
        console.log('--', vm.section);

        activate();

        ////////////////

        function activate() {

        }
    }
})();
