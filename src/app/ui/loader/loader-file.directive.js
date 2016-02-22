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

        self.steps = [
            {
                active: true,
                complete: false
            },
            {
                active: false,
                complete: false
            },
            {
                active: false,
                complete: false
            }
        ];

        self.dropActive = false;
        self.file = null;

        self.filesSubmitted = filesSubmitted;
        self.fileSuccess = fileSuccess;

        self.forward = forward;
        self.back = back;

        function filesSubmitted(files, event, flow) {
            // console.log(files, event, flow);
            self.file = files[0];
            flow.upload();
        }

        function fileSuccess(file, message, flow) {
            self.forward(0);
            $timeout(() => self.forward(0), 300);
            
            console.log(file, message, flow);
        }

        function forward(fromStepNumber) {
            const fromStep = self.steps[fromStepNumber];
            const toStep = self.steps[fromStepNumber + 1];

            fromStep.complete = true;
            if (toStep) {
                fromStep.active = false;
                toStep.active = true;
            }


        }

        function back(fromStepNumber) {
            const fromStep = self.steps[fromStepNumber];
            const toStep = self.steps[fromStepNumber - 1];

            fromStep.complete = false;
            if (toStep) {
                fromStep.active = false;
                toStep.active = true;
            }
        }

        activate();

        /*********/

        function activate() {

        }
    }
})();
