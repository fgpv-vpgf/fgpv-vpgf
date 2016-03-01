(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name stepperService
     * @module app.ui.common
     * @description
     *
     * The `stepper` service provides a common interface to move between a number of steps forming a stepper (Material Desing).
     * Other components should import `Stepper` and add steps to it in the order they appear in the template.
     * Only one step can be active at a time. `Stepper` can move forward and backwards, or jump to any step optionally "completing" intermediate steps.
     *
     */
    angular
        .module('app.ui.common')
        .service('stepper', Stepper);

    // capital 'S' because it's a constructor
    function Stepper() {
        const self = this;

        self.steps = [];
        self.currentStep = null;

        self.start = start;
        self.reset = reset;
        self.addSteps = addSteps;
        self.moveToStep = moveToStep;
        self.nextStep = nextStep;
        self.previousStep = previousStep;

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
         * @param {Array|Object} steps step object to be added
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
