(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name FiltersPanelPlugController
     * @module app.layout
     * @description
     *
     * The `FiltersPanelPlugController` controller handles the filters panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the side panel plug when it's active.
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
        $rootScope.$on('$stateChangeStart',
            function (event, toState) {
                var filtersReg = /filters/;

                if (filtersReg.test(toState.name)) {
                    self.mode = toState.name.split('.').pop();
                }
            });
    }
})();
