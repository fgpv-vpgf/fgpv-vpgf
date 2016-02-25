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

    function Controller($timeout, stepper) {
        'ngInject';
        const self = this;

        self.dropActive = false; // flag to indicate if file drop zone is active

        // TODO: get datatypes from a loader service
        self.steps = [];
        self.dataTypes = {
            geojson: 'GeoJSON',
            csv: 'CSV',
            shapefile: 'Shapefile'
        };

        self.file = null; // flow file object
        self.dataType = null; // string

        self.filesSubmitted = filesSubmitted; // a file is selected or dropped
        self.fileSuccess = fileSuccess;
        self.fileError = fileError;

        activate();

        /*********/

        function activate() {
            self.steps.push({
                titleValue: 'Upload data',
                stepNumber: 1,
                isActive: false,
                isCompleted: false
            }, {
                titleValue: 'Confirm data type',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: () => {
                    console.log(self.dataType);
                    stepper.nextStep();
                },
                onCancel: () => {
                    stepper.previousStep();
                    self.file.cancel(); // removes the file from the upload queue
                    self.file = null; // kill reference as well

                    self.dataType = null;
                }
            }, {
                titleValue: 'Configure layer',
                stepNumber: 3,
                isActive: false,
                isCompleted: false,
                onContinue: () => {
                    stepper.nextStep();
                },
                onCancel: () => {
                    stepper.previousStep();
                }
            });

            stepper
                .addSteps(self.steps)
                .start(); // activate stepper on the first step
        }

        function filesSubmitted(files, event, flow) {
            console.log('submitted', files, event, flow);
            self.file = files[0];
            flow.upload();
        }

        function fileSuccess(file, message, flow) {
            console.log('success', file, message, flow);
            $timeout(() => stepper.nextStep(), 300);
        }

        function fileError(file, message, flow) {
            console.log('error', file, message, flow);
        }
    }
})();
