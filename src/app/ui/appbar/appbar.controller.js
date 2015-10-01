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
        self.toggleSets = toggleSets;
        self.toggleTools = toggleTools;

        // TODO: hacky method of highlighting currently selected button; needs replacement
        self.setsSelected = false;
        self.toolsSelected = false;

        activate();

        function activate() {

        }

        // hacky way to toggle panels;
        // TODO: replace with a sane method
        function toggleSets() {
            if ($state.current.name.indexOf('toc') === -1) {
                $state.go('app.main.toc', {}, {
                    location: false
                });
                self.setsSelected = true;
                self.toolsSelected = false;
            } else {
                $state.go('app', {}, {
                    location: false
                });
                self.setsSelected = false;
            }
        }

        function toggleTools() {
            if ($state.current.name.indexOf('toolbox') === -1) {
                $state.go('app.main.toolbox', {}, {
                    location: false
                });
                self.setsSelected = false;
                self.toolsSelected = true;
            } else {
                $state.go('app', {}, {
                    location: false
                });
                self.toolsSelected = false;
            }
        }
    }
})();
