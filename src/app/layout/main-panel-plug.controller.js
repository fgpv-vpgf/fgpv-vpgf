(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('MainPanelPlugController', MainPanelPlugController);

    /* @ngInject */
    function MainPanelPlugController() {
        var self = this;
        self.active = active;

        function active() {
            return true;
        }
    }
})();
