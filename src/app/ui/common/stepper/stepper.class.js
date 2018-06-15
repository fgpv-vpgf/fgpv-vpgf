/**
 *
 * @module StepperFactory
 * @memberof app.ui
 * @description
 *
 * The `Stepper` class provides a common interface to move between a number of steps forming a stepper [Material Design Stepper](https://www.google.com/design/spec/components/steppers.html#steppers-specs).
 * Other components should import `Stepper`, create a new stepper object using `new Stepper()` and add steps to it in the order they appear in the template.
 * Only one step can be active at a time; you can move forward and backwards, or jump to any step optionally "completing" intermediate steps.
 *
 */
angular
    .module('app.ui')
    .factory('Stepper', StepperFactory);

function StepperFactory($q) {
    /**
     * @class Stepper
     */
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
         * Resets the stepper by deactivating and resetting forms in all steps.
         * @return {Object}            this for chaining
         */
        reset() {
            this.steps.forEach(step => {
                this._configureStep(step, false, false);
                this._reset(step);
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
            [].concat(steps).forEach((step, index) => {
                step._index = index + this.steps.length;
                this.steps.push(step);
            });
            return this;
        }

        /**
         * Moves to the next step.
         * @param  {Promise} continuePromise [optional = $q.resolve()] continuePromise the move will happen only after this promise resolves
         * @return {Object}            itself for chaining
         */
        nextStep(continuePromise = $q.resolve()) {
            return this.moveToStep(Math.min(this.steps.length - 1, this.currentStep._index + 1), continuePromise);
        }

        /**
         * Moves to the previous step resetting the current step.
         * @param  {Promise} [optional] continuePromise the move will happen only after this promise resolves
         * @return {Object}            itself for chaining
         */
        previousStep(continuePromise = $q.resolve()) {
            this._reset(this.currentStep); // reset the current step when attempting to move backward
            return this.moveToStep(Math.max(0, this.currentStep._index - 1), continuePromise);
        }

        /**
         * Will cancel the currently pending movement to a step. If called after the move, nothing happens.
         * @return {Object}            itself for chaining
         */
        cancelMove() {
            if (angular.isFunction(this._resolveCancelPromise)) {
                this._resolveCancelPromise('cancelPromise');
            }

            return this;
        }

        /**
         * Set a specified step as active, completing or resetting all intermediate steps depending on directive of the move.
         * @param  {Number} stepNumber                step id to jump to
         * @param  {Promise} continuePromise [optional = null] the move will happen only after this promise resolves (if a promise is provided)
         * @return {Object}            itself for chaining
         */
        moveToStep(stepNumber, continuePromise = null) {
            this.start().cancelMove();
            // start stepper if not started; cancel any pending moves as there is no use case for chaining them

            if (stepNumber > this.steps.length - 1 || stepNumber < 0) {
                console.error('stepperClass', `step number is out of bounds: ${stepNumber}`);
                return this;
            }

            if (stepNumber === this.currentStep._index) {
                return this;
            }

            this._think(); // set "thinking" mode to block `continue` button from further clicks

            let isMoveCanceled = false;

            if (continuePromise !== null) {
                // create a cancel promise for the move can be canceled by calling `cancelMove` on the stepper instance
                // technically, it's a deferred
                const cancelPromise = $q(resolve => (this._resolveCancelPromise = resolve))
                .then(() => {
                    isMoveCanceled = true;
                    this._think(this.currentStep, false);
                });

                // TODO: switch to $q.race when we update to Angular 1.5+
                // wraps regular promise in $q since Promise doesn't have `finally`
                // can't use Promise.race - it resolves on reject: https://www.jcore.com/2016/12/18/promise-me-you-wont-use-promise-race/
                $q.when(continuePromise.then(() => {
                    this._moveStep(stepNumber, isMoveCanceled);
                })).finally(() => {
                    if (!isMoveCanceled) {
                        this._think(this.currentStep, false); // restore `continue` button to default state if move was not cancelled
                    }
                });
            } else {
                this._moveStep(stepNumber);
                this._think(this.currentStep, false); // restore `continue` button to default state if move was not cancelled
            }

            return this;
        }

        /**
         * Helper function to complete the step movement
         * @param  {Number} stepNumber                step id to jump to
         * @param  {Promise} isMoveCanceled [optional = false] true if the move was cancelled
         */
        _moveStep(stepNumber, isMoveCanceled = false) {
            const currentStepNumber = this.currentStep._index;

            if (!isMoveCanceled) {
                // TODO: it's possible to click the `cancel/continue` button at the moment when the transition to a differnt step starts and this will yo-yo stepper in place
                // one solution would be to disable `cancel/continue` buttons when transition starts
                if (stepNumber > currentStepNumber) { // move forward
                    for (let i = currentStepNumber; i < stepNumber; i++) {
                        const step = this.steps[i];
                        this._configureStep(step, true, false);
                    }
                } else { // move backward
                    for (let i = currentStepNumber; i > stepNumber; i--) {
                        const step = this.steps[i];
                        this._reset(step) // reset intermediate steps when going backward
                            ._configureStep(step, false, false);
                    }
                }

                this.currentStep = this.steps[stepNumber];
                this._configureStep(this.currentStep, false, true);
            }
        }

        /**
         * Puts the current step into the "thinking" mode - the `continue` button is disabled and a progress bar is shown. Stepper feedback should only be used if there is a long latency between steps.
         * @private
         * @param  {Object}  step        step object
         * @param  {Boolean} value =             true indicates if the feedback is displayed
         * @return {Object}            itself for chaining
         */
        _think(step = this.currentStep, value = true) {
            step.isThinking = value;

            return this;
        }

        /**
         * Helper function to set flags on a step object.
         * @private
         * @param  {Object}  step        step object
         * @param  {Boolean} isCompleted sets step's `isCompleted` flag
         * @param  {Boolean} isActive    sets step's `isActive` flag
         * @return {Object}            itself for chaining
         */
        _configureStep(step, isCompleted, isActive) {
            step.isCompleted = isCompleted;
            step.isActive = isActive;

            return this;
        }

        /**
         * Calls `reset` function on the step object if one is present
         * @private
         * @return {Object}            itself for chaining
         */
        _reset(step) {
            this.cancelMove();

            if (angular.isFunction(step.reset)) {
                step.reset();
            }

            return this;
        }
    }
    // jscs:enable requireSpacesInAnonymousFunctionExpression

    return Stepper;
}
