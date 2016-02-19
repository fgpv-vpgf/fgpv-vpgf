(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rv-loader-file
     * @module app.ui.loader
     * @restrict A
     * @description
     *
     * The `rv-loader-file` directive description.
     *
     */
    angular
        .module('app.ui.loader')
        .directive('rvLoaderFile', rvLoaderFile);

    function rvLoaderFile() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/loader/loader-file.html',
            scope: {
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link() { // scope, el, attr, ctrl) {

        }
    }

    function Controller() {
        // const self = this;

        activate();

        /*********/

        function activate() {

        }
    }
})();
