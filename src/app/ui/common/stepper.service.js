(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name stepperService
     * @module app.ui.common
     * @description
     *
     * The `stepper` service description.
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

        console.log('self.steps', self.steps);

        function start(stepNumber = 0) {
            if (!self.currentStep && self.steps.length > 0) {
                self.currentStep = self.steps[stepNumber];
                self.currentStep.isActive = true;
            }

            return self;
        }

        function reset() {
            self.steps.forEach(step => {
                step.isActive = false;
                step.isCompleted = false;
            });

            self.currentStep = null;

            return self;
        }

        function addSteps(steps) {
            self.steps = self.steps.concat(steps);
            console.log('self.steps', self.steps);

            return self;
        }

        function moveToStep(stepNumber, completeCurrentStep = true, completeIntermediateSteps = true) {
            self.start();

            const currentStepNumber = self.steps.indexOf(self.currentStep);

            if (stepNumber === currentStepNumber) {
                return self;
            }

            if (stepNumber > currentStepNumber) {
                for (let i = currentStepNumber + 1; i < stepNumber; i++) {
                    console.log(i);
                    const step = self.steps[i];
                    step.isCompleted = completeIntermediateSteps;
                }
                self.currentStep = self.steps[stepNumber - 1];
                self.nextStep(completeCurrentStep);
            } else {
                for (let i = currentStepNumber - 1; i > stepNumber; i--) {
                    console.log(i);
                    const step = self.steps[i];
                    step.isCompleted = completeIntermediateSteps;
                }
                self.currentStep = self.steps[stepNumber + 1];
                self.previousStep(completeCurrentStep);
            }

            return self;
        }

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
