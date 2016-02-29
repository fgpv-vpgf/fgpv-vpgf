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
        self.steps = [];
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

        self.file = null; // flow file object
        self.dataType = null; // string

        /*self.filesSubmitted = filesSubmitted; // a file is selected or dropped
        self.fileSuccess = fileSuccess;
        self.fileError = fileError;*/

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
            stepper
                .addSteps(self.upload.step);

            self.steps.push({
                titleValue: 'Confirm data type',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: () => {
                    console.log(self.dataType);
                    stepper.nextStep();

                    console.log('=>', self.steps[1], this);

                    console.log('__form1', self.__form1);
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
                    self.configureLayerForm.$setValidity('required', true, {
                        a: true
                    });
                    self.configureLayerForm.$setValidity('customKey', false, true);

                    // stepper.nextStep();
                },
                onCancel: () => {
                    self.configureLayerForm.$setPristine();
                    self.configureLayerForm.$setUntouched();
                    stepper.previousStep();
                }
            });

            stepper
                .addSteps(self.steps)
                .start(); // activate stepper on the first step
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
            this.form.$setValidity('upload-error', false, true);
        }

        function fileReset() {
            /* jshint validthis:true */
            this.file = null;
            this.form.$setValidity('upload-error', true, true);
        }
    }
})();

(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvFileValidation
     * @module app.ui.loader
     * @restrict A
     * @description
     *
     * The `rvFileValidation` directive description.
     *
     */
    angular
        .module('app.ui.loader')
        .directive('rvFileValidation', rvFileValidation);

    function rvFileValidation() {
        const directive = {
            restrict: 'A',
            require: 'ngModel',
            link: link
        };

        return directive;

        /**********/

        function link(scope, el, attr, ctrl) {
            console.log('rvFileValidation', scope, el, attr, ctrl);
        }
    }
})();
