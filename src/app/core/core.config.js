(function () {
    'use strict';

    angular
        .module('app.core')
        .config(configBlock);

    configBlock.$inject = ['$translateProvider', '$stateProvider', 'statehelperConfigProvider'];

    function configBlock($translateProvider, $stateProvider, statehelperConfigProvider) {
        configureStateRouting();
        configureTranslations();

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
    }
})();
