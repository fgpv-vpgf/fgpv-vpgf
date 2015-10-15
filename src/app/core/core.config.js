(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name app.core#configBlock
     * @module app.core
     * @description
     *
     * The `configBlock` does three things right now:
     * - configure our custom stateHelper to work with $stateProvider from ui-router,
     * - configure translation provider by prepping static loader (and optionally setting preferred language if we know what it is),
     * - configure theme colours for angular material
     */
    angular
        .module('app.core')
        .config(configBlock);

    /* @ngInject */
    function configBlock($translateProvider, $stateProvider,
        $mdThemingProvider, statehelperConfigProvider) {

        configureStateRouting();
        configureTranslations();
        configureTheme();

        /**
         * Set state provider for `configHelper`.
         */
        function configureStateRouting() {
            var stateCfg = statehelperConfigProvider;
            stateCfg.config.$stateProvider = $stateProvider;
        }

        /**
         * Configure angular translation provider. Set locale files location and file name pattern.
         */
        function configureTranslations() {
            $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
            $translateProvider.useStaticFilesLoader({
                prefix: './locales/',
                suffix: '/translation.json'
            });

            //$translateProvider.preferredLanguage('en-CA');
        }

        /**
         * Set theme colours from material desing colour palette.
         */
        function configureTheme() {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue-grey')
                .accentPalette('cyan');
        }
    }
})();
