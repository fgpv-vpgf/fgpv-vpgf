(function() {
    'use strict';

    angular
        .module('app.ui.toolbar')
        .controller('ToolbarController', ToolbarController);

    function ToolbarController(layoutService) {
        var self = this;

        self.layoutService = layoutService;

        activate();

        function activate() {

        }
    }
})();
