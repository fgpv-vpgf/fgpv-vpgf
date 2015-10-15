(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name FiltersPanelPlugController
     * @module app.layout
     * @requires $rootScope
     * @description
     *
     * The `FiltersPanelPlugController` controller handles the filters panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the side panel plug when it's active.
     * `self.mode` is bound to a CSS class indicating current mode of the filters panel (default, attached, minimized, or full). `rvMorph` is used to animate between modes.
     */
    angular
        .module('app.layout')
        .controller('FiltersPanelPlugController', FiltersPanelPlugController);

    /* @ngInject */
    function FiltersPanelPlugController($rootScope) {
        var self = this;
        self.active = true;
        self.mode = 'default';

        // staggers the main panel's transition if the side panel is open
        // FIXME: should be moved to a filter service and made sane
        $rootScope.$on('$stateChangeStart',
            function (event, toState) {
                var filtersReg = /filters/;

                if (filtersReg.test(toState.name)) {
                    self.mode = toState.name.split('.').pop();
                }
            });
    }
})();
