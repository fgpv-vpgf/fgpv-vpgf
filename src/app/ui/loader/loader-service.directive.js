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

    function Controller($timeout, stateManager, geoService, Geo, Stepper, LayerBlueprint) {
        'ngInject';
        const self = this;

        self.closeLoaderService = closeLoaderService;

        self.serviceTypes = [
            Geo.Service.Types.FeatureLayer,
            Geo.Service.Types.DynamicService,
            Geo.Service.Types.TileService,
            Geo.Service.Types.ImageService,
            Geo.Service.Types.WMS
        ];

        self.fields = {
            one: 'one',
            two: 'two',
            three: 'three'
        };

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        self.connect = {
            step: {
                titleValue: 'import.service.connect.title',
                stepNumber: 1,
                isActive: false,
                isCompleted: false,
                onContinue: connectOnContinue,
                onCancel: connectOnCancel
            },
            form: null,
            serviceUrl: null,
            serviceType: null,
            serviceResetValidation() {

                // reset broken endpoint error message when user modifies service url
                toggleErrorMessage(this.form, 'serviceUrl', 'broken', true);
            }
        };
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        self.select = {
            step: {
                titleValue: 'import.service.select.title',
                stepNumber: 2,
                isActive: false,
                isCompleted: false,
                onContinue: selectOnContinue,
                onCancel: selectOnCancel
            },
            form: null
        };

        self.configure = {
            step: {
                titleValue: 'import.service.configure.title',
                stepNumber: 3,
                isActive: false,
                isCompleted: false,
                onContinue: configureOnContinue,
                onCancel: configureOnCancel
            },
            form: null,
            options: {}
        };

        self.layerBlueprint = null;

        const stepper = new Stepper();
        stepper
            .addSteps(self.connect.step)
            .addSteps(self.select.step)
            .addSteps(self.configure.step)
            .start(); // activate stepper on the first step

        console.log(stepper);

        /***/

        /**
         * Tiny helper function to set/reset error messages on fields
         * @param  {Object} form      form object
         * @param  {String} fieldName field name to set the error on
         * @param  {String} errorName name of the error message
         * @param  {Boolean} state     =             false; false - show error, true - hide error
         */
        function toggleErrorMessage(form, fieldName, errorName, state = false) {
            form[fieldName].$setValidity(errorName, state);
        }

        /**
         * Tries to create a service LayerBlueprint from the url provided. If creation is successful, proceeds to the next step.
         * If creation fails, display a "broken service url" error message. This can happen because the provided url is not a service endpoint or if the service endpoint doesn't respond.
         */
        function connectOnContinue() {
            const connect = self.connect;

            // creating new service blueprint with the provided url
            // since there is no layer type provided, blueprint will try to get service data
            self.layerBlueprint = new LayerBlueprint.service({
                url: connect.serviceUrl
            });

            console.log(self.layerBlueprint);

            self.layerBlueprint.ready
                .then(() => stepper.nextStep())
                .catch(() => {
                    console.log('self.connect.form.serviceUrl');

                    toggleErrorMessage(connect.form, 'serviceUrl', 'broken', false); // , connect.step);
                });
        }

        /**
         * Clears service url field and all error displayed; sets the form into pristine, untouched state (so no default validation errors (like "required" or "not a proper url") will show)
         */
        function connectOnCancel() {
            const connect = self.connect;

            connect.serviceUrl = '';
            connect.form.serviceUrl.$setPristine();
            connect.form.serviceUrl.$setUntouched();
            connect.serviceResetValidation();

            stepper.previousStep();
        }

        /**
         * Validates created service Layer Blueprint against selected service type.
         * TODO: do the validation if at all possible;
         */
        function selectOnContinue() {
            stepper.nextStep();
        }

        /**
         * Moves stepped backwards to the connect step where user can enter a new service url.
         */
        function selectOnCancel() {
            stepper.previousStep();
        }

        /**
         * Builds layer with the specified options and adds it to the map; displays error message if something is not right.
         */
        function configureOnContinue() {
            // TODO: display error message if something breaks
            // TODO: close import wizard if build is successful
            geoService.constructLayers([self.layerBlueprint]);
            closeLoaderService();
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
