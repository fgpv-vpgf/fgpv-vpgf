(() => {
    'use strict';

    // jscs doesn't like enhanced object notation
    // jscs:disable requireSpacesInAnonymousFunctionExpression
    class Stepper {
        constructor() {
            this.steps = [];
            this.currentStep = null;
        }

        /**
         * Start stepper by activating the specified step.
         * @param  {Number} stepNumber id of the step to activate, defaults to 0
         * @return {Object}            itself for chaining
         */
        start(stepNumber = 0) {
            if (!this.currentStep && this.steps.length > 0) {
                this.currentStep = this.steps[stepNumber];
                this.currentStep.isActive = true;
            }

            return this;
        }

        /**
         * Resets the stepper by deactivating all steps.
         * @return {Object}            this for chaining
         */
        reset() {
            this.steps.forEach(step => {
                // call function reseting form on the step
                step.onCancel();

                step.isActive = false;
                step.isCompleted = false;
            });

            this.currentStep = null;

            return this;
        }

        /**
         * Adds steps to this instance of the Stepper service.
         * a step object must have two properties: `isActive` and `isCompleted`; they are bound to the `step-item` template and determine the visual appearance of a step;
         * `isActive` indicates that a step's content is exposed to the user and awaits user input; only one step should be active at a time;
         * `isCompleted` indicates that user input satisfies this step's validation; step's number badge is replaced with a checkmark icon;
         * @param {Array|Object} steps step object(s) to be added; either an array of step objects or a single step object can be added; the order in which steps are added to the stepper service will be used for navigation between steps;
         * @return {Object}            itself for chaining
         */
        addSteps(steps) {
            this.steps = this.steps.concat(steps);

            // console.log('this.steps', this.steps);

            return this;
        }

        /**
         * Set a specified step as active, optionally completing all intermediate steps.
         * @param  {Number} stepNumber                step id to jump to
         * @param  {Boolean} completeCurrentStep       flag indicating if the current step should be completed
         * @param  {Boolean} completeIntermediateSteps  flag indicating if the steps in between should be completed
         * @return {Object}            itself for chaining
         */
        moveToStep(stepNumber, completeCurrentStep = true, completeIntermediateSteps = true) {
            this.start();

            const currentStepNumber = this.steps.indexOf(this.currentStep);

            if (stepNumber === currentStepNumber) {
                return this;
            }

            if (stepNumber > currentStepNumber) {
                for (let i = currentStepNumber + 1; i < stepNumber; i++) {
                    // console.log(i);
                    const step = this.steps[i];
                    step.isCompleted = completeIntermediateSteps;
                }
                this.currentStep = this.steps[stepNumber - 1];
                this.nextStep(completeCurrentStep);
            } else {
                // TODO: when moving back, need to call reset on steps to clear their respective forms
                for (let i = currentStepNumber - 1; i > stepNumber; i--) {
                    // console.log(i);
                    const step = this.steps[i];
                    step.isCompleted = completeIntermediateSteps;
                }
                this.currentStep = this.steps[stepNumber + 1];
                this.previousStep(completeCurrentStep);
            }

            return this;
        }

        /**
         * Moves to the next step.
         * @param  {Boolean} completeCurrentStep       flag indicating if the current step should be completed
         * @return {Object}            itself for chaining
         */
        nextStep(completeCurrentStep = true) {
            this.start();

            const currentStepNumber = this.steps.indexOf(this.currentStep);
            const toStep = this.steps[currentStepNumber + 1];

            this.currentStep.isCompleted = completeCurrentStep;
            this.currentStep.isActive = false;

            if (toStep) {
                toStep.isActive = true;
            }

            this.currentStep = toStep;

            return this;
        }

        /**
         * Moves to the previous step.
         * @param  {Boolean} completeCurrentStep       flag indicating if the current step should be completed
         * @return {Object}            itself for chaining
         */
        previousStep(completeCurrentStep = false) {
            this.start();

            const currentStepNumber = this.steps.indexOf(this.currentStep);
            const toStep = this.steps[currentStepNumber - 1];

            this.currentStep.isCompleted = completeCurrentStep;

            if (toStep) {
                this.currentStep.isActive = false;
                toStep.isActive = true;
                toStep.isCompleted = false;
            }

            this.currentStep = toStep;

            return this;
        }
    }
    // jscs:enable requireSpacesInAnonymousFunctionExpression

    /**
     * @ngdoc object
     * @name Stepper
     * @module app.ui.common.stepper
     * @description
     *
     * The `Stepper` class provides a common interface to move between a number of steps forming a stepper [Material Design Stepper](https://www.google.com/design/spec/components/steppers.html#steppers-specs).
     * Other components should import `Stepper`, create a new stepper object using `new Stepper()` and add steps to it in the order they appear in the template.
     * Only one step can be active at a time; you can move forward and backwards, or jump to any step optionally "completing" intermediate steps.
     *
     */
    angular
        .module('app.ui.common.stepper')
        .constant('Stepper', Stepper);
})();
