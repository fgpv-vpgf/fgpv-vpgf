(function () {
    'use strict';

    angular
        .module('app.ui')
        .factory('rvSideNavigationService', rvSideNavigationService);

    /* @ngInject */
    function rvSideNavigationService($mdSidenav) {
        /* jshint shadow:true */
        /* jshint unused:false */
        var service = {
            open: open,
            close: close,
            toggle: toggle
        };

        return service;

        ////////////////

        function open() {
            $mdSidenav('left')
                .open()
                .then(function () {
                    console.debug('close LEFT is done');
                });
        }

        function close() {
            $mdSidenav('left')
                .close()
                .then(function () {
                    console.debug('close LEFT is done');
                });
        }

        function toggle(argument) {
            console.log(argument);
        }
    }
})();
