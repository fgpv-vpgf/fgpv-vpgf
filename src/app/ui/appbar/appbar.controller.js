(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name AppbarController
     * @module app.ui.appbar
     * @description
     *
     * The `AppbarController` controller handles the main application bar.
     * Right now it's hacked together for demo purposes.
     */
    angular
        .module('app.ui.appbar')
        .controller('AppbarController', AppbarController);

    /* @ngInject */
    /**
     * `AppbarController` has lots of garbage code so far, needed to show how the panels are toggled. It should be moved to service.
     *
     * @param {object} layoutService
     * @param {object} $state
     */
    function AppbarController(layoutService, $state) {
        var self = this;

        self.layoutService = layoutService;
        self.toggleToc = toggleToc;
        self.toggleToolbox = toggleToolbox;

        // FIXME: hacky method of highlighting currently selected button; needs replacement
        self.tocSelected = false;
        self.toolboxSelected = false;

        activate();

        function activate() {

        }

        // hacky way to toggle panels;
        // FIXME: replace with a sane method
        function toggleToc() {
            //var stateName = 'app.filters.default';
            var stateName = 'app.main.toc';

            if ($state.current.name.indexOf(stateName) === -1) {
                $state.go(stateName, {}, {
                    location: false
                });
                self.tocSelected = true;
                self.toolboxSelected = false;
            } else {
                $state.go('app', {}, {
                    location: false
                });
                self.tocSelected = false;
            }
        }

        function toggleToolbox() {
            var stateName = 'app.main.toolbox';

            //var stateName = 'app.filters.default';

            if ($state.current.name.indexOf(stateName) === -1) {
                $state.go(stateName, {}, {
                    location: false
                });
                self.tocSelected = false;
                self.toolboxSelected = true;
            } else {
                $state.go('app', {}, {
                    location: false
                });
                self.toolboxSelected = false;
            }
        }
    }
})();
