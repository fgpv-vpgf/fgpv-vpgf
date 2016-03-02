(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rv-loader-service
     * @module app.ui.loader
     * @restrict A
     * @description
     *
     * The `rv-loader-service` directive creates a stepper interface for importing map services and online-based geo files and turning them into layers.
     *
     */
    angular
        .module('app.ui.loader')
        .directive('rvLoaderService', rvLoaderService);

    function rvLoaderService() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/loader/loader-service.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($timeout, stateManager, stepper) {
        'ngInject';
        const self = this;

        self.closeLoaderFile = closeLoaderFile;

        self.dropActive = false; // flag to indicate if file drop zone is active

        // TODO: get datatypes from a loader service
        self.dataTypes = {
            geojson: 'GeoJSON',
            csv: 'CSV',
            shapefile: 'Shapefile'
        };
        self.fields = {
            one: 'one',
            two: 'two',
            three: 'three'
        };

        activate();

        /*********/

        function activate() {

            self.upload = {
                step: {
                    titleValue: 'Upload data',
                    stepNumber: 1,
                    isActive: false,
                    isCompleted: false
                },
                form: null,
                file: null,
                filesSubmitted: uploadFilesSubmitted,
                fileSuccess: uploadFileSuccess,
                fileError: uploadFileError,
                fileReset: uploadFileReset,
            };

            self.select = {
                step: {
                    titleValue: 'Select file format',
                    stepNumber: 2,
                    isActive: false,
                    isCompleted: false,
                    onContinue: selectOnContinue,
                    onCancel: selectOnCancel
                },
                form: null,
                dataType: null
            };

            self.configure = {
                step: {
                    titleValue: 'Configure layer',
                    stepNumber: 3,
                    isActive: false,
                    isCompleted: false,
                    onContinue: configureOnContinue,
                    onCancel: configureOnCancel
                },
                form: null,
                options: {}
            };

            stepper
                .addSteps(self.upload.step)
                .addSteps(self.select.step)
                .addSteps(self.configure.step)
                .start(); // activate stepper on the first step
        }

        /**
         * Builds layer with the specified options and adds it to the map; displays error message if something is not right.
         */
        function configureOnContinue() {
            // TODO: try to build layer and add it to the map
            // TODO: display error message if something breaks
            stepper.nextStep();
        }

        /**
         * Cancels the layer configuration step and rolls back to file type selection.
         */
        function configureOnCancel() {
            self.configure.options = {}; // reset layer options

            stepper.previousStep();
        }

        function selectOnContinue() {
            // console.log(self.select.dataType);
            stepper.nextStep();
        }

        /**
         * Cancels the file type selection and rolls back to file upload.
         */
        function selectOnCancel() {
            // console.log('selectOnCancel');
            stepper.previousStep();
            self.upload.fileReset(); // reset the upload form
            self.select.dataType = null;
        }

        /**
         * Starts file upload.
         * @param  {Array} files uploaded array of files
         * @param  {Object} event submitted event
         * @param  {Object} flow  flow object https://github.com/flowjs/ng-flow
         */
        function uploadFilesSubmitted(files, event, flow) {
            // TODO: if current step is not the first and user drag-drops file, go back to first step
            // console.log('submitted', files, event, flow);
            if (files.length > 0) {
                self.upload.file = files[0]; // store the first file from the array;
                flow.upload();
            }
        }

        /**
         * When a file is uploaded, calls gapi to get data type and field names if possible.
         * @param  {Object} file    uploaded flow file object
         * @param  {Object} message a success message
         * @param  {Object} flow  flow object https://github.com/flowjs/ng-flow
         */
        function uploadFileSuccess() { // file, message, flow) {
            // console.log('success', file, message, flow);
            // TODO: call geoapi to guess filetype :_ ; throw erorr if unsupported format
            $timeout(() => stepper.nextStep(), 300); // add some delay before going to the next step
        }

        /**
         * Displays an error message if a file fails to upload
         * @param  {Object} file    flow file object
         * @param  {String} message error message
         * @param  {Object} flow    flow object https://github.com/flowjs/ng-flow
         */
        function uploadFileError() { // file, message, flow) {
            // console.log('error', file, flow);
            const upload = self.upload;
            upload.form.$setValidity('upload-error', false, upload.step);
        }

        /**
         * Reset the file upload form removing custom messages.
         */
        function uploadFileReset() {
            const upload = self.upload;

            if (upload.file) { // if there is a file in the queue
                upload.file.cancel(); // removes the file from the upload queue
            }
            upload.file = null; // kill reference as well

            // arguments as follows: name of the error, state of the error, a controller object which will be stored against the error; when removing the same error, need to provide the same controller object
            upload.form.$setValidity('upload-error', true, upload.step); // remove errors from the form
        }

        /**
         * Closes loader pane and switches to toc.
         */
        function closeLoaderFile() {
            // TODO: abstract; maybe move to stateManager itself
            const item = stateManager.state.main.history.slice(-2).shift(); // get second to last history item
            const options = {};

            // reopen previous selected pane if it's not null or 'mainLoaderFile'
            if (item !== null && item !== 'mainLoaderFile') {
                options[item] = true;
            } else {
                options.mainLoaderFile = false;
            }

            // close `mainDetails` panel
            stateManager.setActive(options);
        }
    }
})();
