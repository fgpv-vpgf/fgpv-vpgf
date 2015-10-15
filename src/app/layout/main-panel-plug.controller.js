(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name MainPanelPlugController
     * @module app.layout
     * @description
     *
     * The `MainPanelPlugController` controller handles the main panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the plug when it's active.
     * `self.isStaggering` is triggering a `stagger` CSS class to be added to the plug when a side panel is open.
     */
    angular
        .module('app.layout')
        .controller('MainPanelPlugController', MainPanelPlugController);

    /* @ngInject */
    /**
     * Main Panel plug controller.
     * `self.active` is bound to a CSS class that prevents the plug view from occupying space when its content is not visible.
     * [deprecated] `self.isStaggering` is bound to CSS class to delay closing of the main panel when a side panel is open
     *
     * @param {object} $rootScope
     */
    function MainPanelPlugController($rootScope) {
        var self = this;
        self.active = true;
        self.isStaggering = false;

        //////////////

        // staggers the main panel's transition if the side panel is open
        // FIXME: move to mainpanel service?
        $rootScope.$on('$stateChangeStart',
            function (event, toState) {
                var sideReg = /(app)\.(main)\.(.*)\.(side)/;
                self.isStaggering = sideReg.test(toState.name);
            });
    }
})();
