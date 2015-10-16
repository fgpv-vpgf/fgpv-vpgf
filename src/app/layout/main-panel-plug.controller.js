(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name MainPanelPlugController
     * @module app.layout
     * @description
     *
     * The `MainPanelPlugController` controller handles the main panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the plug when it's active. It's is bound to a CSS class that prevents the plug view from occupying space when its content is not visible.
     */
    angular
        .module('app.layout')
        .controller('MainPanelPlugController', MainPanelPlugController);

    /* @ngInject */
    function MainPanelPlugController($rootScope) {
        const self = this;
        self.active = true;
        self.isStaggering = false;

        //////////////

        // staggers the main panel's transition if the side panel is open
        // FIXME: move to mainpanel service?
        $rootScope.$on('$stateChangeStart',
            function (event, toState) {
                const sideReg = /(app)\.(main)\.(.*)\.(side)/;
                self.isStaggering = sideReg.test(toState.name);
            });
    }
})();
