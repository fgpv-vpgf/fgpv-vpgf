(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name SidePanelPlugController
     * @module app.layout
     * @description
     *
     * The `SidePanelPlugController` controller handles the side panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the side panel plug when it's active.
     */
    angular
        .module('app.layout')
        .controller('SidePanelPlugController', SidePanelPlugController);

    /* @ngInject */
    function SidePanelPlugController() {
        var self = this;
        self.active = true;
    }
})();
