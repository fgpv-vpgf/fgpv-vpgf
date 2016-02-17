(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rv-lloader-file
     * @module app.ui.lloader
     * @restrict A
     * @description
     *
     * The `rv-lloader-file` directive description.
     *
     */
    angular
        .module('app.ui.lloader')
        .directive('rvLloaderFile', rvLloaderFile);

    function rvLloaderFile() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/lloader/lloader-file.html',
            scope: {
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link() { // scope, el, attr, ctrl) {

        }
    }

    function Controller() {
        //const self = this;

        activate();

        ///////////

        function activate() {

        }
    }
})();
