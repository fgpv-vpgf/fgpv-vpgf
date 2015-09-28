(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('MainPanelPlugController', MainPanelPlugController);

    /* @ngInject */
    function MainPanelPlugController($rootScope) {
        var self = this;
        self.active = active;
        self.isStaggering = false;

        //////////////

        function active() {
            return true;
        }

        // staggers the main panel's transition if the side panel is open
        $rootScope.$on('$stateChangeStart',
            function (event, toState) {
                var sideReg = /(app)\.(main)\.(.*)\.(side)/;
                self.isStaggering = sideReg.test(toState.name);
            });
    }
})();
