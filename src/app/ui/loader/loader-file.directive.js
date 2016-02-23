(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rv-loader-file
     * @module app.ui.loader
     * @restrict A
     * @description
     *
     * The `rv-loader-file` directive description.
     *
     */
    angular
        .module('app.ui.loader')
        .directive('rvLoaderFile', rvLoaderFile);

    function rvLoaderFile() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/loader/loader-file.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link() { // scope, el, attr, ctrl) {

        }
    }

    function Controller($timeout) {
        'ngInject';
        const self = this;

        // TODO: get datatypes from a loader service
        self.steps = [];
        self.dataTypes = {
            geojson: 'GeoJSON',
            csv: 'CSV',
            shapefile: 'Shapefile'
        };

        self.dropActive = false;
        self.file = null;
        self.dataType = null;

        self.filesSubmitted = filesSubmitted;
        self.fileSuccess = fileSuccess;

        activate();

        /*********/

        function activate() {
            self.steps.push({
                titleValue: 'Upload data',
                stepNumber: 1,
                isActive: true,
                isCompleted: false
            }, {
                titleValue: 'Confirm data type',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: () => {
                    console.log(self.dataType);
                    forward(1);
                },
                onCancel: () => {
                    back(1);
                    self.file.cancel();
                    self.file = null;

                    self.dataType = null;
                }
            }, {
                titleValue: 'Configure layer',
                stepNumber: 3,
                isActive: false,
                isCompleted: false,
                onContinue: () => {
                    forward(2);
                },
                onCancel: () => {
                    back(2);

                    // self.dataType = null;
                }
            });
        }

        function filesSubmitted(files, event, flow) {
            console.log(files, event, flow);
            self.file = files[0];
            flow.upload();
        }

        function fileSuccess(file, message, flow) {
            console.log(file, message, flow);
            $timeout(() => forward(0), 300);
        }

        // TODO: this will be reused, so it needs to go into a service
        // move the stepper forward to the next step (if any)
        function forward(fromStepNumber) {
            const fromStep = self.steps[fromStepNumber];
            const toStep = self.steps[fromStepNumber + 1];

            fromStep.isCompleted = true;
            fromStep.isActive = false;
            if (toStep) {
                toStep.isActive = true;
            }
        }

        // TODO: this will be reused, so it needs to go into a service
        // move the stepper backward to the previous step (if any)
        function back(fromStepNumber) {
            const fromStep = self.steps[fromStepNumber];
            const toStep = self.steps[fromStepNumber - 1];

            fromStep.isCompleted = false;
            toStep.isCompleted = false;

            if (toStep) {
                fromStep.isActive = false;
                toStep.isActive = true;
            }
        }
    }
})();
