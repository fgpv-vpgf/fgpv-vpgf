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

    function Controller($timeout, stateManager, Geo, Stepper, LayerBlueprint) {
        'ngInject';
        const self = this;
        const stepper = new Stepper();

        self.closeLoaderService = closeLoaderService;

        self.serviceTypes = [
            Geo.Service.Types.FeatureLayer,
            Geo.Service.Types.DynamicService,
            Geo.Service.Types.TileService,
            Geo.Service.Types.ImageService,
            Geo.Service.Types.WMS
        ];
        /*{
            esriFeature: 'ESRI Feature Layer',
            ogcWms: 'OGC Web Map Service',
            unicorn: 'Unicorn Service Type'
        };*/

        self.fields = {
            one: 'one',
            two: 'two',
            three: 'three'
        };

        self.connect = {
            step: {
                titleValue: 'Connect to a service',
                stepNumber: 1,
                isActive: false,
                isCompleted: false,
                onContinue: connectOnContinue,
                onCancel: connectOnCancel
            },
            form: null,
            serviceUrl: null,
            serviceType: null
        };

        self.select = {
            step: {
                titleValue: 'Select Service type',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: selectOnContinue,
                onCancel: selecteOnCancel
            },
            form: null
        };

        self.configure = {
            step: {
                titleValue: 'Configure layer',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: configureOnContinue,
                onCancel: configureOnCancel
            },
            form: null,
            options: {}
        };

        self.layerBlueprint = null;

        stepper
            .addSteps(self.connect.step)
            .addSteps(self.select.step)
            .addSteps(self.configure.step)
            .start(); // activate stepper on the first step

        console.log(stepper);

        /***/

        function connectOnContinue() {
            self.layerBlueprint = new LayerBlueprint.service({
                url: self.connect.serviceUrl
            });

            self.layerBlueprint.then(data => {
                console.log('connect', data);
            });
        }

        function connectOnCancel() {

        }

        function selectOnContinue() {

        }

        function selectOnCancel() {

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

        /**
         * Closes loader pane and switches to toc.
         */
        function closeLoaderService() {
            // TODO: abstract; maybe move to stateManager itself
            const item = stateManager.state.main.history.slice(-2).shift(); // get second to last history item
            const options = {};

            stepper.reset().start();

            // reopen previous selected pane if it's not null or 'mainLoaderService'
            if (item !== null && item !== 'mainLoaderService') {
                options[item] = true;
            } else {
                options.mainLoaderService = false;
            }

            // close `mainDetails` panel
            stateManager.setActive(options);
        }
    }
})();
