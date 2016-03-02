(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLoaderMenu
     * @module app.ui.loader
     * @restrict E
     * @description
     *
     * The `rvLoaderMenu` directive description.
     * TODO: add description
     *
     */
    angular
        .module('app.ui.loader')
        .directive('rvLoaderMenu', rvLoaderMenu);

    function rvLoaderMenu() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/loader/loader-menu.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.state = stateManager.state.mainLoaderFile;

        self.openFileLoader = openFileLoader;

        /***/

        function openFileLoader() {
            // TODO: hack
            stateManager.setActive({
                mainLoaderFile: true
            });
        }
    }
})();
