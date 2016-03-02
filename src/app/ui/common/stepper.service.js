(() => {
    'use strict';

    /**
     * @ngdoc factory
     * @name stepperFactory
     * @module app.ui.common
     * @description
     *
     * The `stepperFactory` factory provides a common interface to move between a number of steps forming a stepper [Material Design Stepper](https://www.google.com/design/spec/components/steppers.html#steppers-specs).
     * Other components should import `stepperFactory`, create a new stepper object using `stepperFactory()` and add steps to it in the order they appear in the template.
     * Only one step can be active at a time; you can move forward and backwards, or jump to any step optionally "completing" intermediate steps.
     *
     */
    angular
        .module('app.ui.common')
        .factory('stepperFactory', () => stepperFactory);

    function stepperFactory() {
        const self = {
            steps: [],
            currentStep: null,

            start: start,
            reset: reset,
            addSteps: addSteps,
            moveToStep: moveToStep,
            nextStep: nextStep,
            previousStep: previousStep
        };

        return self;

        /**
         * Start stepper by activating the specified step.
         * @param  {Number} stepNumber id of the step to activate, defaults to 0
         * @return {Object}            itself for chaining
         */
        function start(stepNumber = 0) {
            if (!self.currentStep && self.steps.length > 0) {
                self.currentStep = self.steps[stepNumber];
                self.currentStep.isActive = true;
            }

            return self;
        }

        /**
         * Resets the stepper by deactivating all steps.
         * @return {Object}            itself for chaining
         */
        function reset() {
            self.steps.forEach(step => {
                // TODO: reset form on the step itself
                step.isActive = false;
                step.isCompleted = false;
            });

            self.currentStep = null;

            return self;
        }

        /**
         * Adds steps to this instance of the Stepper service.
         * a step object must have two properties: `isActive` and `isCompleted`; they are bound to the `step-item` template and determine the visual appearance of a step;
         * `isActive` indicates that a step's content is exposed to the user and awaits user input; only one step should be active at a time;
         * `isCompleted` indicates that user input satisfies this step's validation; step's number badge is replaced with a checkmark icon;
         * @param {Array|Object} steps step object(s) to be added; either an array of step objects or a single step object can be added; the order in which steps are added to the stepper service will be used for navigation between steps;
         * @return {Object}            itself for chaining
         */
        function addSteps(steps) {
            self.steps = self.steps.concat(steps);

            // console.log('self.steps', self.steps);

            return self;
        }

        /**
         * Set a specified step as active, optionally completing all intermediate steps.
         * @param  {Number} stepNumber                step id to jump to
         * @param  {Boolean} completeCurrentStep       flag indicating if the current step should be completed
         * @param  {Boolean} completeIntermediateSteps  flag indicating if the steps in between should be completed
         * @return {Object}            itself for chaining
         */
        function moveToStep(stepNumber, completeCurrentStep = true, completeIntermediateSteps = true) {
            self.start();

            const currentStepNumber = self.steps.indexOf(self.currentStep);

            if (stepNumber === currentStepNumber) {
                return self;
            }

            if (stepNumber > currentStepNumber) {
                for (let i = currentStepNumber + 1; i < stepNumber; i++) {
                    // console.log(i);
                    const step = self.steps[i];
                    step.isCompleted = completeIntermediateSteps;
                }
                self.currentStep = self.steps[stepNumber - 1];
                self.nextStep(completeCurrentStep);
            } else {
                // TODO: when moving back, need to call reset on steps to clear their respective forms
                for (let i = currentStepNumber - 1; i > stepNumber; i--) {
                    // console.log(i);
                    const step = self.steps[i];
                    step.isCompleted = completeIntermediateSteps;
                }
                self.currentStep = self.steps[stepNumber + 1];
                self.previousStep(completeCurrentStep);
            }

            return self;
        }

        /**
         * Moves to the next step.
         * @param  {Boolean} completeCurrentStep       flag indicating if the current step should be completed
         * @return {Object}            itself for chaining
         */
        function nextStep(completeCurrentStep = true) {
            self.start();

            const currentStepNumber = self.steps.indexOf(self.currentStep);
            const toStep = self.steps[currentStepNumber + 1];

            self.currentStep.isCompleted = completeCurrentStep;
            self.currentStep.isActive = false;

            if (toStep) {
                toStep.isActive = true;
            }

            self.currentStep = toStep;

            return self;
        }

        /**
         * Moves to the previous step.
         * @param  {Boolean} completeCurrentStep       flag indicating if the current step should be completed
         * @return {Object}            itself for chaining
         */
        function previousStep(completeCurrentStep = false) {
            self.start();

            const currentStepNumber = self.steps.indexOf(self.currentStep);
            const toStep = self.steps[currentStepNumber - 1];

            self.currentStep.isCompleted = completeCurrentStep;

            if (toStep) {
                self.currentStep.isActive = false;
                toStep.isActive = true;
                toStep.isCompleted = false;
            }

            self.currentStep = toStep;

            return self;
        }
    }
})();
