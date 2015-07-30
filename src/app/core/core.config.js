(function() {
    'use strict';

    angular
        .module('app.core')
        .config(configBlock);

    configBlock.$inject = ['$translateProvider'];

    function configBlock($translateProvider) {
        $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
        $translateProvider.useStaticFilesLoader({
            prefix: './locales/',
            suffix: '/translation.json'
        });
        //$translateProvider.preferredLanguage('en-CA');
    }
})();
