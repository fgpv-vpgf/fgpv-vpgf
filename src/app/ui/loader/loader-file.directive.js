// Need to add exported module to window as it needs it internally.
import Flow from '@flowjs/ng-flow/dist/ng-flow-standalone';
window.Flow = Flow;

const templateUrl = require('./loader-file.html');

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
    .module('app.ui')
    .directive('rvLoaderFile', rvLoaderFile);

function rvLoaderFile() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller($scope, $q, $timeout, $http, stateManager, Stepper, LayerBlueprint, $rootElement,
    keyNames, layerSource, legendService) {
    'ngInject';
    const self = this;

    self.closeLoaderFile = closeLoaderFile;
    self.dropActive = false; // flag to indicate if file drop zone is active

    // create three steps: upload data, select data type, and configure layer
    self.upload = {
        step: {
            titleValue: 'import.file.upload.title',
            stepNumber: 1,
            isActive: false,
            isCompleted: false,
            onContinue: uploadOnContinue,
            onCancel: () => {
                uploadReset();  // reset upload progress bar
                onCancel(self.upload.step);
            },
            onKeypress: event => {
                const upload = self.upload;
                // prevent enter presses from triggering upload if the input value is not validated
                if (event.keyCode === keyNames.ENTER) {
                    if (upload.form.$valid &&
                        upload.step.isContinueEnabled &&
                        !upload.step.isThinking) {
                        // check if enter key have been pressed and call the next step if so
                        uploadOnContinue();
                    }

                    if (!upload.form.$valid) {
                        toggleErrorMessage(upload.form, 'fileUrl', 'url', false);
                    }
                }
            },
            reset: uploadReset
        },
        form: null,
        file: null,
        fileData: null,
        fileUrl: null,
        filesSubmitted: uploadFilesSubmitted,
        fileUploadAbort: angular.noop,

        fileReset,
        fileResetValidation,

        fileUrlReset,
        fileUrlResetValidation,

        httpProgress: false, // shows progress loading file using $http
        progress: 0,
        fileStatus: null
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
            onCancel: () => onCancel(self.configure.step),
            reset: configureReset
        },
        configureResetValidation,
        colourPickerSettings: {
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
        let isFileUploadAborted = false;

        self.upload.httpProgress = true;

        // set `httpProgress` to false to hide the progress bar immediately as the Cancel button is clicked
        self.upload.fileUploadAbort = () => {
            self.upload.httpProgress = false;
            isFileUploadAborted = true;
        };

        const loaderPromise = _loadFile(self.upload.fileUrl).then(arrayBuffer =>
                isFileUploadAborted ?
                    $q.reject({ reason: 'abort', message: 'User canceled file upload.' }) :
                    onLayerBlueprintReady(self.upload.fileUrl, arrayBuffer).then(() => (self.upload.httpProgress = false))
            ).catch(error => {
                if (error.reason === 'abort') {
                    console.log('loaderFileDirective', 'file upload has been aborted by the user', error.message);
                    return;
                }

                console.error('loaderFileDirective', 'problem retrieving file link with error', error.message);
                toggleErrorMessage(self.upload.form, 'fileUrl', 'upload-error', false);
            });

        // add some delay before going to the next step
        stepper.nextStep($timeout(() =>
            loaderPromise, 300));

        /**
         * Tries to load a file specified using $http service.
         *
         * @function _loadFile
         * @param {String} url absolute file url
         * @return {Promise} a promise resolving with file arraybuffer if successful
         */
        function _loadFile(url) {
            const promise = $http.get(url, {
                responseType: 'arraybuffer',
                eventHandlers: {
                    progress: event => {
                        if (!isFileUploadAborted && event.lengthComputable) {
                            const units = event.loaded < 1048576 ? 'KB' : 'MB';

                            let loaded = Math.round(event.loaded / (units === 'KB' ? 1024 : 1048576));
                            const total = Math.ceil(event.total / 1048576);

                            self.upload.fileStatus = `${loaded}${units} / ${total}MB`;

                            if (units === 'KB') {
                                loaded = loaded / 1024;
                            }

                            self.upload.progress = Math.round((loaded / total) * 100);
                        }
                    }
                }
            }).then(response =>
                response.data
            ).catch(error => {
                console.log(error);
                return $q.reject({ reason: 'error', message: 'Cannot retrieve file data' });
            });

            return promise;
        }
    }

    /**
     * Starts file upload.
     * @function uploadFilesSubmitted
     * @param  {Array} files uploaded array of files
     */
    function uploadFilesSubmitted(files) {
        if (files.length > 0) {
            // reset any fields and move back to the first step (in the case where we drag-and-drop from a different step)
            // after moving back to the first step, we can continue with the file uploading
            uploadReset();
            stepper.moveToStep(0);

            const file = files[0];
            self.upload.file = file; // store the first file from the array;

            const reader = new FileReader();

            // to cancel the file upload, stop the file reader
            // after `abort` is called, `onabort` event is fired which rejects `_readFile` promise
            self.upload.fileUploadAbort = () =>
                reader.abort();

            const readerPromise = _readFile(reader, file.file, _updateProgress).then(arrayBuffer =>
                    onLayerBlueprintReady(file.name, arrayBuffer)
                ).catch(error => {
                    if (error.reason === 'abort') {
                        console.log('loaderFileDirective', 'file upload has been aborted by the user', error.message);
                        return;
                    }

                    console.error('loaderFileDirective', 'file upload has failed with error', error.message);
                    toggleErrorMessage(self.upload.form, 'fileSelect', 'upload-error', false);
                });

            // add some delay before going to the next step
            // explicitly move to step 1 (select); if the current step is not 0 (upload), drag-dropping a file may advance farther than needed when using just `stepper.nextStep()`
            stepper.moveToStep(1, $timeout(() =>
                readerPromise, 300));
        }

        /**
         * Reads HTML5 File object data.
         * @private
         * @param {File} file a file object to read
         * @param {FileReader} reader an instance of HTML5 fire reader
         * @param {Function} progressCallback a function which is called during the process of reading file indicating how much of the total data has been read
         * @return {Promise} promise resolving with file's data
         */
        function _readFile(reader, file, progressCallback) {
            const dataPromise = $q((resolve, reject) => {

                reader.onerror = () => {
                    console.error('layerBlueprint', 'failed to read a file');
                    reject({ reason: 'error', message: 'Failed to read a file' });
                };
                reader.onload = () =>
                    resolve(reader.result);
                reader.onprogress = event =>
                    progressCallback(event, reader);

                reader.onabort = event =>
                    reject({ reason: 'abort', message: 'User canceled file upload.' });

                reader.readAsArrayBuffer(file);
            });

            return dataPromise;
        }

        /**
         * Updates file load progress status.
         * @function  _updateProgress
         * @private
         * @param  {Object} event ProgressEvent object
         */
        function _updateProgress(event, reader) {

            // indicates if the resource concerned by the ProgressEvent has a length that can be calculated.
            if (event.lengthComputable) {
                const percentLoaded = Math.round((event.loaded / event.total) * 100);
                // Increase the progress bar length.
                if (percentLoaded <= 100) {
                    console.log('loaderFileDirective', `currently loaded ${percentLoaded}%`);

                    self.upload.progress = percentLoaded;
                    $scope.$apply();
                }
            }
        }
    }

    /**
     * Waits until the layerBlueprint is create and ready (the data has been read) and moves to the next step.
     * @function onLayerBlueprintReady
     * @param  {String} name file name or url
     * @param  {ArrayBuffer} arrayBuffer raw file data
     * @return {Promise} layerBlueprint ready promise
     */
    function onLayerBlueprintReady(name, arrayBuffer) {

        const layerSourcePromise = layerSource.fetchFileInfo(name, arrayBuffer)
            .then(({ options: layerSourceOptions, preselectedIndex }) => {
                self.layerSourceOptions = layerSourceOptions;
                self.layerSource = layerSourceOptions[preselectedIndex];
            });

        return layerSourcePromise;
    }

    /**
     * Clears both file selector and url field.
     * @function uploadReset
     */
    function uploadReset() {
        self.upload.fileUploadAbort();

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

        upload.progress = 0;
        upload.fileStatus = null;

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
        let validationPromise;

        // incorrectly picking GeoJSON results in syntax error, must be caught here
        try {
            validationPromise = self.layerSource.validate();
        } catch (e) {
            console.error('loaderFileDirective', 'file type is wrong', e);
            toggleErrorMessage(self.select.form, 'dataType', 'wrong', false);
            return;
        }

        validationPromise.catch(error => {
            console.error('loaderFileDirective', 'file type is wrong', error);
            toggleErrorMessage(self.select.form, 'dataType', 'wrong', false);
            // TODO: display a meaningful error message why the file doesn't validate (malformed csv, zip with pictures of cats, etc.)
        });

        stepper.nextStep(validationPromise);
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

        uploadReset();  // reset the upload progress bar
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
     * Sets the form to pristine, untouched state (so no default validation errors (like "required") will show)
     * @function selectReset
     */
    function configureReset() {
        const configure = self.configure;

        configure.form.$setPristine();
        configure.form.$setUntouched();

        // this will reset all the user-editable options to their defaults
        // if reset is called before initial file upload, layerSource is undefined
        if (self.layerSource) {
            self.layerSource.reset();
        }

        // TODO: generalize resetting custom form validation
        configure.configureResetValidation();
    }

    /**
     * Resets file type validation error messages.
     * @function selectResetValidation
     */
    function configureResetValidation() {
        // reset wrong file type error message
        self.configure.form.$setValidity('invalid', true);
        // toggleErrorMessage(self.select.form, 'dataType', 'wrong', true);
    }

    /**
     * Builds layer with the specified options and adds it to the map; displays error message if something is not right.
     * @function configureOnContinue
     */
    function configureOnContinue() {
        const layerBlueprint = new LayerBlueprint.file(self.layerSource);

        layerBlueprint.validateFileLayerSource()
            .then(esriLayer => {
                legendService.importLayerBlueprint(layerBlueprint);
                closeLoaderFile();
            }).catch(error => {
                console.warn('loaderFileDirective', 'file is invalid ', error);
                self.configure.form.$setValidity('invalid', false);
            });
    }

    /**
     * Closes loader pane and switches to the previous pane if any.
     * @function closeLoaderFile
     */
    function closeLoaderFile() {
        // reset the loader after closing the panel
        stepper.reset().start();
        stateManager.setActive('mainToc');

        // there is a bug with Firefox and Safari on a Mac. They don't focus back to add layer when close
        $timeout(() => {
            $rootElement.find('.rv-loader-add').first().rvFocus();
        }, 0);
    }
}
