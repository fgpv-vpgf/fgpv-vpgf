(function () {
    'use strict';

    angular
        .module('app.ui.sidenav')
        .controller('SideNavigationController', SideNavigation);

    SideNavigation.$inject = ['$mdSidenav', '$state', '$mdDialog', 'layout'];

    /* @ngInject */
    function SideNavigation($mdSidenav, $state, $mdDialog, layout) {
        var vm = this;

        vm.close = closea;
        vm.toggle = toggle;
        vm.switchState = switchState;

        vm.settings = [
            [
                {
                    icon: 'open_with',
                    name: 'Full Screen',
                    state: 'app.default',
                    enabled: false
                },
                {
                    icon: 'print',
                    name: 'Print',
                    state: 'app.default',
                    enabled: false
                },
                {
                    icon: 'share',
                    name: 'Share',
                    state: 'app.default',
                    enabled: false
                }
            ],
            [
                {
                    icon: 'info',
                    name: 'About',
                    state: 'app.about',
                    enabled: true
                },
                // {
                //     icon: 'info',
                //     name: 'Default About',
                //     state: 'app.default.about'
                // },
                {
                    icon: 'help',
                    name: 'Help',
                    state: 'app.help',
                    enabled: true
                }
            ]
        ];

        activate();

        ////////////////

        function activate() {
            layout.registerSidenav(vm);
        }

        function switchState(state, event) {
            if (state === 'app.help' || state === 'app.about') {
                console.log(event);
            } else {
                $state.go(state);
            }
            vm.close();
        }

        function closea() {
            $mdSidenav('left')
                .close()
                .then(function () {
                    console.debug('close LEFT is done');
                });
        }

        function toggle() {
            $mdSidenav('left')
                .then(function (s) {
                    s.toggle();
                    console.debug('close LEFT is done');
                });
        }
    }

    DialogController.$inject = ['$scope', '$mdDialog'];

    function DialogController($scope, $mdDialog) {
        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }
})();
