(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMapnavButton
     * @module app.ui.mapnav
     * @description
     *
     * The `rvMapnavButton` directive is a map navigation compoenent button.
     *
     */
    angular
        .module('app.ui.mapnav')
        .directive('rvMapnavButton', rvMapnavButton);

    /* @ngInject */
    function rvMapnavButton() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/ui/mapnav/mapnav-button.html',
            scope: {
                control: '='
            },
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function linkFunc() { //scope, el, attr, ctrl) {

        }
    }

    /* @ngInject */
    function Controller() {
        //var self = this;

        ///////////

        activate();

        function activate() {

        }
    }
})();
