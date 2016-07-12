(() => {
    'use strict';

    /**
     * @module rvLoaderMenu
     * @memberof app.ui
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

        // TODO: need a better way to determine if the layer loader is active or not
        self.state = stateManager.state;

        self.openFileLoader = openFileLoader;
        self.openServiceLoader = openServiceLoader;

        /***/

        function openFileLoader() {
            // TODO: hack
            stateManager.setActive({
                mainLoaderFile: true
            });
        }

        function openServiceLoader() {
            // TODO: hack
            stateManager.setActive({
                mainLoaderService: true
            });
        }
    }
})();
