(function () {
    'use strict';

    angular
        .module('app.core')
        .config(configBlock);

    /* @ngInject */
    function configBlock($translateProvider, $stateProvider,
        $mdThemingProvider, statehelperConfigProvider) {

        configureStateRouting();
        configureTranslations();
        configureTheme();

        function configureStateRouting() {
            var stateCfg = statehelperConfigProvider;
            stateCfg.config.$stateProvider = $stateProvider;
        }

        function configureTranslations() {
            $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
            $translateProvider.useStaticFilesLoader({
                prefix: './locales/',
                suffix: '/translation.json'
            });

            //$translateProvider.preferredLanguage('en-CA');
        }

        function configureTheme() {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue-grey')
                .accentPalette('cyan');
        }
    }
})();
