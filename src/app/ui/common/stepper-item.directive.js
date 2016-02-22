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
                step: '=?',
                titleValue: '@?',
                summaryValue: '@?',
                stepNumber: '@?',
                isActive: '=?',
                isCompleted: '=?',
                onComplete: '&?',
                onCancel: '&?',
                isContinueEnabled: '=?',
                isCancelEnabled: '=?'
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
            self.step = angular.isDefined(self.step) ? self.step : {};

            // apply defaults
            applyDefaults('titleValue', '');
            applyDefaults('summaryValue', '');
            applyDefaults('stepNumber', '');

            applyDefaults('isActive');
            applyDefaults('isCompleted');
            applyDefaults('onComplete');
            applyDefaults('onCancel');

            applyDefaults('isContinueEnabled', true);
            applyDefaults('isCancelEnabled', true);

            function applyDefaults(name, d = false) {
                if (!angular.isDefined(self[name]) && !angular.isDefined(self.step[name])) {
                    self.step[name] = d;
                }
            }
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
