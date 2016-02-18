(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvStepperItem
     * @module app.ui.common
     * @restrict E
     * @description
     *
     * The `rvStepperItem` directive description.
     *
     */
    angular
        .module('app.ui.common')
        .directive('rvStepperItem', rvStepperItem);

    function rvStepperItem() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/common/stepper-item.html',
            scope: {
                titleValue: '@?',
                summaryValue: '@?',
                stepNumber: '@?'
            },
            transclude: true,
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
