(function () {
    'use strict';

    angular
        .module('app.ui.toolbar')
        .controller('ToolbarController', ToolbarController);

    function ToolbarController(layoutService, $state) {
        var self = this;

        self.layoutService = layoutService;
        self.toggleSets = toggleSets;
        self.toggleTools = toggleTools;

        activate();

        function activate() {

        }

        function toggleSets() {
            if ($state.current.name.indexOf('sets') === -1) {
                $state.go('app.main.sets', {}, {
                    location: false
                });
            } else {
                $state.go('app', {}, {
                    location: false
                });
            }
        }

        function toggleTools() {
            if ($state.current.name.indexOf('tools') === -1) {
                $state.go('app.main.tools', {}, {
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
