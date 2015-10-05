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
            if ($state.current.name.indexOf('toc') === -1) {
                $state.go('app.main.toc', {}, {
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
            if ($state.current.name.indexOf('toolbox') === -1) {
                $state.go('app.main.toolbox', {}, {
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
