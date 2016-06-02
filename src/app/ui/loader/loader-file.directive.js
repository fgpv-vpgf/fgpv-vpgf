(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rv-loader-file
     * @module app.ui.loader
     * @restrict A
     * @description
     *
     * The `rv-loader-file` directive creates a stepper interface for loading local files with geodata and turning them into layers.
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

    function Controller($timeout, stateManager, Stepper, gapiService, geoService, LayerFileBlueprint) {
        'ngInject';
        const self = this;
        let stepper;

        self.closeLoaderFile = closeLoaderFile;
        self.dropActive = false; // flag to indicate if file drop zone is active

        // TODO: get datatypes from a loader service
        self.dataTypes = {
            geojson: 'GeoJSON',
            csv: 'CSV',
            shapefile: 'Shapefile'
        };

        self.upload = {
            step: {
                titleValue: 'Upload data',
                stepNumber: 1,
                isActive: false,
                isCompleted: false,
                onContinue: uploadOnContinue,
                onCancel: uploadOnCancel
            },
            form: null,
            file: null,
            fileData: null,
            fileUrl: null,
            filesSubmitted: uploadFilesSubmitted,
            fileSuccess: uploadFileSuccess,
            fileError: uploadFileError,
            fileReset: uploadFileReset,
            fileUrlReset: uploadFileUrlReset,
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
            fields: null,
            form: null,
            options: {}
        };

        self.layerBlueprint = null;

        stepper = new Stepper();
        stepper
            .addSteps(self.upload.step)
            .addSteps(self.select.step)
            .addSteps(self.configure.step)
            .start(); // activate stepper on the first step

        /*********/

        /**
         * Builds layer with the specified options and adds it to the map; displays error message if something is not right.
         */
        function configureOnContinue() {
            // TODO: try to build layer and add it to the map
            // TODO: display error message if something breaks

            geoService.constructLayers([self.layerBlueprint]);
            closeLoaderFile();
        }

        /**
         * Cancels the layer configuration step and rolls back to file type selection.
         */
        function configureOnCancel() {
            // self.configure.options = {}; // reset layer options

            stepper.previousStep();
        }

        function selectOnContinue() {
            // console.log('User selected', self.select.dataType);
            // self.layerBlueprint.fileType = self.select.dataType;

            self.layerBlueprint.valid
                .then(() => {
                    stepper.nextStep();
                })
                .catch(error => {
                    console.error('File type is wrong', error);
                    // TODO: display error message that the file doesn not validate
                });
        }

        /**
         * Cancels the file type selection and rolls back to file upload.
         */
        function selectOnCancel() {
            // console.log('selectOnCancel');
            stepper.previousStep();
            self.upload.fileReset(); // reset the upload form
            // self.select.dataType = null;
        }

        /**
         * In cases where user provides a file link, tries to load the file and then advanced to the next step.
         */
        function uploadOnContinue() {
            self.layerBlueprint = new LayerFileBlueprint(self.upload.fileUrl);
            onLayerBlueprintReady();
        }

        /**
         * Clears both file selector and url field.
         */
        function uploadOnCancel() {
            uploadFileReset();
            uploadFileUrlReset();
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
        function uploadFileSuccess(file, message, flow) {
            console.log('success', file, message, flow);

            self.layerBlueprint = new LayerFileBlueprint(file.name, file.file, file.getExtension());
            onLayerBlueprintReady();
        }

        function onLayerBlueprintReady() {
            self.layerBlueprint.ready
                .then(() => {
                    // self.select.dataType = self.layerBlueprint.fileType;

                    $timeout(() => stepper.nextStep(), 300); // add some delay before going to the next step
                })
                .catch(error => {
                    console.error('Something awful happen', error);
                });
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
            console.log('upload form', upload.form);
            upload.form.fileSelect.$setValidity('upload-error', false, upload.step);
        }

        /**
         * Reset the file upload form removing custom messages.
         */
        function uploadFileReset() {
            const upload = self.upload;

            if (upload.file) { // if there is a file in the queue
                upload.file.cancel(); // removes the file from the upload queue
                upload.file = null; // kill reference as well
            }

            // arguments as follows: name of the error, state of the error, a controller object which will be stored against the error; when removing the same error, need to provide the same controller object
            upload.form.fileSelect.$setValidity('upload-error', true, upload.step); // remove errors from the form
        }

        /**
         * Resets the file url field and removes errors in the file upload step.
         */
        function uploadFileUrlReset() {
            const upload = self.upload;

            upload.fileUrl = '';
            upload.form.fileUrl.$setPristine();
            upload.form.fileUrl.$setUntouched();
        }

        /**
         * Closes loader pane and switches to the previous pane if any.
         */
        function closeLoaderFile() {
            // reset the loader after closing the panel
            stepper.reset().start();
            stateManager.openPrevious('mainLoaderFile');
        }
    }
})();
