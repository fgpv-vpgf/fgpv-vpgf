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

    function Controller($scope, $timeout, stepper) {
        'ngInject';
        const self = this;

        // self.__form1 = {a: 999};

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

        self.dataType = null; // string

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
                fileSelectorOpened, // wanted to use es6 lexical this, but jshint complains; need to update to the newer version of jshint
                filesSubmitted,
                fileSuccess,
                fileError,
                fileReset,
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
                dataType: null,
                selectReset: selectReset
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

        function configureOnContinue() {
            /*self.configure.form.$setValidity('required', true, {
                a: true
            });
            self.configure.form.$setValidity('customKey', false, true);*/

            // stepper.nextStep();
        }

        function configureOnCancel() {
            self.configure.options = {};

            // self.configure.form.$setPristine();
            // self.configure.form.$setValidity();
            // self.configure.form.$setUntouched();

            stepper.previousStep();
        }

        function selectOnContinue() {
            console.log(self.select.dataType);
            stepper.nextStep();
        }

        function selectOnCancel() {
            console.log('selectOnCancel');
            stepper.previousStep();
            self.upload.fileReset();
            self.select.selectReset();
        }

        function selectReset() {
            self.select.dataType = null;

            // self.select.form.$setPristine();
            // self.select.form.$setValidity('required', true);
            // self.select.form.$setUntouched();

            // self.select.form.$setValidity('required', true, true);
        }

        function fileSelectorOpened() {
            /* jshint validthis:true */
            this.fileReset();
        }

        function filesSubmitted(files, event, flow) {
            /* jshint validthis:true */
            console.log('submitted', files, event, flow, this);
            this.file = files[0];
            flow.upload();
        }

        function fileSuccess(file, message, flow) {
            /* jshint validthis:true */
            console.log('success', file, message, flow, this);
            $timeout(() => stepper.nextStep(), 300);
        }

        function fileError(file, message, flow) {
            /* jshint validthis:true */
            console.log('error', file, flow, this.form);
            this.form.$setValidity('upload-error', false, this.step);
        }

        function fileReset() {
            /* jshint validthis:true */
            if (this.file) {
                this.file.cancel(); // removes the file from the upload queue
            }
            this.file = null; // kill reference as well

            this.form.$setPristine();
            this.form.$setUntouched();

            // arguments as follows: name of the error, state of the error, a controller object which will be stored against the error; when removing the same error, need to provide the same controller object
            this.form.$setValidity('upload-error', true, this.step); // remove errors from the form
        }
    }
})();
