(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvStepperItem
     * @module app.ui.common
     * @restrict E
     * @description
     *
     * The `rvStepperItem` directive is a step implementation in Material Design stepper component.
     * Material Design has specs for a [Stepper component](https://www.google.com/design/spec/components/steppers.html#steppers-specs). Steppers display progress through a sequence by breaking it up into multiple logical and numbered steps. Unfortunatelly, Angular Material didn't implement it yet, so we have to build our own.
     * This directive represents a single step (`Stepper` service provides navigation between linked steps) which wraps the specified content in a form to provide field validation. `Continue` and `Cancel` buttons can be display in each step. `Continue` button is disabled unless the form is valid. `Cancel` button clears the form and remove all the standard error messages.
     *
     * `Stepper-items` should not be nested.
     *
     * // TODO: check if individual overrides even make sense and useful; removing them will siplify the template;
     * `title-value` a string to be displayed in the step's header
     * `summary-value` a string to be displayed under the step's header; not shown if omitted
     * `step-number` the step number to be displayed
     * `is-active` a boolean flag specifying if the step is active (open) at the moment
     * `is-complete` a boolean flag specifying is the step has been completed (checkmark is shown instead of the step's number)
     * `on-continue` a function to call when the user pressed the `continue` button; the `continue` button is not shown if the function is omitted
     * `on-cancel` a function to call when the user pressed the `cancel` button; the `cancel` button is not shown if the function is omitted
     * `is-continue-enabled` a boolean flag indicating if the `continue` button is enabled; doesn't make sense if `on-cancel` is omitted
     * `is-cancel-enabled` a boolean flag indicating if the `cancel` button is enabled; doesn't make sense if `on-continue` is omitted
     * `step` a shortcut for all other properties which can be supplied in an object; first, a explicit binding takes precedence over anything supplied in the `step` property
     * `step-form` is an object reference to which stepper item's form will be bound, so it can be access from the parent directive
     *
     * Usage example:
     * ```html
     * <stepper-item
     *         title-value="Pick a side"
     *         summary-value="Empire or Rebels"
     *         step-number="2"
     *         is-active="true"
     *         is-active="false"
     *         on-continue="forward"
     *         on-cancel="back"
     *         is-continue-enabled="true"
     *         is-cancel-enabled="false">
     *
     * </stepper-item>
     * ```
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
                onContinue: '&?',
                onCancel: '&?',
                isContinueEnabled: '=?',
                isCancelEnabled: '=?',
                stepForm: '=?form'
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
            applyDefaults('onContinue');
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
        const self = this;

        self.onCancelBefore = onCancelBefore;

        /*********/

        /**
         * Called when the `Cancel` button is clicked; this resets the inner form to its default state, hiding all the standard error messages, executes extrenal callback after.
         */
        function onCancelBefore() {
            // reset the form on cancel
            self.stepForm.$setPristine();
            self.stepForm.$setUntouched();

            // call cancel function
            (self.onCancel || self.step.onCancel)();
        }
    }
})();
