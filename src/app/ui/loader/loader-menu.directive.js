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
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link() { // scope, el, attr, ctrl) {

        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.openFileLoader = openFileLoader;

        activate();

        /***/

        function activate() {

        }

        function openFileLoader() {
            // TODO: hack
            stateManager.setActive({
                mainLoaderFile: true
            });
        }
    }
})();
