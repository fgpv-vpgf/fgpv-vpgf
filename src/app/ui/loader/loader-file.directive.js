(() => {
    'use strict';

    /**
     * @module rvLoaderFile
     * @memberof app.ui
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
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($scope, $q, $timeout, stateManager, Stepper, geoService, LayerBlueprint, Geo) {
        'ngInject';
        const self = this;

        self.closeLoaderFile = closeLoaderFile;
        self.dropActive = false; // flag to indicate if file drop zone is active

        self.fileTypes = [
            Geo.Service.Types.CSV,
            Geo.Service.Types.GeoJSON,
            Geo.Service.Types.Shapefile
        ];

        // create three steps: upload data, selecct data type, and configure layer
        self.upload = {
            step: {
                titleValue: 'import.file.upload.title',
                stepNumber: 1,
                isActive: false,
                isCompleted: false,
                onContinue: uploadOnContinue,
                onCancel: () => onCancel(self.upload.step),
                reset: uploadReset
            },
            form: null,
            file: null,
            fileData: null,
            fileUrl: null,
            filesSubmitted: uploadFilesSubmitted,

            fileReset,
            fileResetValidation,

            fileUrlReset,
            fileUrlResetValidation,

            progress: 0
        };

        self.select = {
            step: {
                titleValue: 'import.file.select.title',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: selectOnContinue,
                onCancel: () => onCancel(self.select.step),
                reset: selectReset
            },
            selectResetValidation,
            form: null
        };

        self.configure = {
            step: {
                titleValue: 'import.file.configure.title',
                stepNumber: 3,
                isActive: false,
                isCompleted: false,
                onContinue: configureOnContinue,
                onCancel: () => onCancel(self.configure.step)
            },
            colorPickerSettings: {
                theme: 'bootstrap',
                position: 'top right'
            },
            fields: null,
            form: null
        };

        self.layerBlueprint = null;

        const stepper = new Stepper();
        stepper
            .addSteps(self.upload.step)
            .addSteps(self.select.step)
            .addSteps(self.configure.step)
            .start(); // activate stepper on the first step

        /***/

        /**
         * Tiny helper function to set/reset error messages on fields
         * * TODO: need to abstract - loader-service has the same function
         * @function toggleErrorMessage
         * @param  {Object} form      form object
         * @param  {String} fieldName field name to set the error on
         * @param  {String} errorName name of the error message
         * @param  {Boolean} state     =             false; false - show error, true - hide error
         */
        function toggleErrorMessage(form, fieldName, errorName, state = false) {
            // when showing errors, dirty and touch the fields
            // this is needed when a preselected field causes validation to fail; since user hasn't interacted with the field, it's untouched and pristine and error messages are not shown for untouched fields;
            if (!state) {
                form[fieldName].$setDirty();
                form[fieldName].$setTouched();
            }

            form[fieldName].$setValidity(errorName, state);
        }

        /**
         * Cancels any stepper movements if the step is processing data; resets input and moves to the previous step if not.
         * @function onCancel
         * @param {Object} step FIXME add docs
         */
        function onCancel(step) {
            if (step.isThinking) {
                stepper.cancelMove();
            } else {
                stepper.previousStep(); // going to the previous step will auto-reset the current one (even if there is no previous step to go to)
            }
        }

        /**
         * In cases where user provides a file link, tries to load the file and then advanced to the next step.
         * @function uploadOnContinue
         */
        function uploadOnContinue() {
            onLayerBlueprintReady(self.upload.fileUrl)
                .catch(error => {
                    // TODO: show a meaningful error about why upload failed.
                    console.error('Something awful happen', error);
                    toggleErrorMessage(self.upload.form, 'fileUrl', 'upload-error', false);
                });
        }

        /**
         * Starts file upload.
         * FIXME this describes more args than it takes
         * @function uploadFilesSubmitted
         * @param  {Array} files uploaded array of files
         * @param  {Object} event submitted event
         * @param  {Object} flow  flow object https://github.com/flowjs/ng-flow
         */
        function uploadFilesSubmitted(files) { // , event, flow) {
            // console.log('submitted', files, event, flow);
            if (files.length > 0) {
                const file = files[0];
                self.upload.file = file; // store the first file from the array;

                onLayerBlueprintReady(file.name, file.file)
                    .catch(error => {
                        // TODO: show a meaningful error about why upload failed.
                        console.error('Something awful happen', error);
                        toggleErrorMessage(self.upload.form, 'fileSelect', 'upload-error', false);
                    });
            }
        }

        /**
         * Waits until the layerBlueprint is create and ready (the data has been read) and moves to the next step.
         * @function onLayerBlueprintReady
         * @param  {String} name file name or url
         * @param  {Object} file optional: html5 file object
         * @return {Promise} layerBlueprint ready promise
         */
        function onLayerBlueprintReady(name, file) {
            self.layerBlueprint = new LayerBlueprint.file(
                geoService.epsgLookup, geoService.mapObject.spatialReference.wkid,
                name, file, updateProgress
            );

            // add some delay before going to the next step
            // explicitly move to step 1 (select); if the current step is not 0 (upload), drag-dropping a file may advance farther than needed when using just `stepper.nextStep()`
            stepper.moveToStep(1, $timeout(() => self.layerBlueprint.ready, 300));

            return self.layerBlueprint.ready;

            /**
             * Updates file load progress status.
             * @function  updateProgress
             * @param  {Object} event ProgressEvent object
             */
            function updateProgress(event) {
                // indicates if the resource concerned by the ProgressEvent has a length that can be calculated.
                if (event.lengthComputable) {
                    const percentLoaded = Math.round((event.loaded / event.total) * 100);
                    // Increase the progress bar length.
                    if (percentLoaded <= 100) {
                        console.log(percentLoaded + '%');

                        self.upload.progress = percentLoaded;
                        $scope.$apply();
                    }
                }
            }
        }

        /**
         * Clears both file selector and url field.
         * @function uploadReset
         */
        function uploadReset() {
            fileReset();
            fileUrlReset();
        }

        /**
         * Reset the file upload form removing selected file and custom error messages.
         * @function fileReset
         */
        function fileReset() {
            const upload = self.upload;

            if (upload.file) { // if there is a file in the queue
                upload.file.cancel(); // removes the file from the upload queue
                upload.file = null; // kill reference as well
                upload.progress = 0; // reset progress bar to 0; otherwise, it will try to animate from 100 to 0 next time progress event happens
            }

            fileResetValidation();
        }

        /**
         * Resets validation on the file selector only.
         * @function fileResetValidation
         */
        function fileResetValidation() {
            // arguments as follows: name of the error, state of the error, a controller object which will be stored against the error; when removing the same error, need to provide the same controller object
            toggleErrorMessage(self.upload.form, 'fileSelect', 'upload-error', true); // remove errors from the form
        }

        /**
         * Resets the file url field and removes errors in the file upload step.
         * @function fileUrlReset
         */
        function fileUrlReset() {
            const upload = self.upload;

            upload.fileUrl = '';
            upload.form.fileUrl.$setPristine();
            upload.form.fileUrl.$setUntouched();

            fileUrlResetValidation();
        }

        /**
         * Resets validation on the fileUrl field only.
         * @function fileUrlResetValidation
         */
        function fileUrlResetValidation() {
            toggleErrorMessage(self.upload.form, 'fileUrl', 'upload-error', true);
        }

        /**
         * Validates created file Layer Blueprint against selected file type. Shows a generic error message if validation fails.
         * @function selectOnContinue
         */
        function selectOnContinue() {
            const validationPromise = self.layerBlueprint.validate();

            stepper.nextStep(validationPromise);

            // console.log('User selected', self.layerBlueprint.fileType);
            validationPromise.catch(error => {
                console.error('File type is wrong', error);
                toggleErrorMessage(self.select.form, 'dataType', 'wrong', false);
                // TODO: display a meaningful error message why the file doesn't validate (malformed csv, zip with pictures of cats, etc.)
            });
        }

        /**
         * Sets the form to pristine, untouched state (so no default validation errors (like "required") will show)
         * @function selectReset
         */
        function selectReset() {
            const select = self.select;

            select.form.$setPristine();
            select.form.$setUntouched();

            // TODO: generalize resetting custom form validation
            select.selectResetValidation();
        }

        /**
         * Resets file type validation error messages.
         * @function selectResetValidation
         */
        function selectResetValidation() {
            // reset wrong file type error message
            toggleErrorMessage(self.select.form, 'dataType', 'wrong', true);
        }

        /**
         * Builds layer with the specified options and adds it to the map; displays error message if something is not right.
         * @function configureOnContinue
         */
        function configureOnContinue() {
            // TODO: display error message if something breaks

            geoService.constructLayers([self.layerBlueprint]);
            closeLoaderFile();
        }

        /**
         * Closes loader pane and switches to the previous pane if any.
         * @function closeLoaderFile
         */
        function closeLoaderFile() {
            // reset the loader after closing the panel
            stepper.reset().start();
            stateManager.setActive('mainToc');
        }
    }
})();
