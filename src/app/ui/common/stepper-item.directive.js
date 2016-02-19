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
                stepNumber: '@?',
                isActive: '=?',
                isCompleted: '=?'
            },
            transclude: true,
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link(scope) { // scope, el, attr, ctrl) {
            const self = scope.self;

            // apply defaults
            self.isActive = angular.isDefined(self.isActive) ? self.isActive : false;
            self.isCompleted = angular.isDefined(self.isCompleted) ? self.isCompleted : false;
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
