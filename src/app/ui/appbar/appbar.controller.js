(function () {
    'use strict';

    angular
        .module('app.ui.appbar')
        .controller('AppbarController', AppbarController);

    function AppbarController(layoutService, $state) {
        var self = this;

        self.layoutService = layoutService;
        self.toggleSets = toggleSets;
        self.toggleTools = toggleTools;

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
            } else {
                $state.go('app', {}, {
                    location: false
                });
            }
        }

        function toggleTools() {
            if ($state.current.name.indexOf('toolbox') === -1) {
                $state.go('app.main.toolbox', {}, {
                    location: false
                });
            } else {
                $state.go('app', {}, {
                    location: false
                });
            }
        }
    }
})();
