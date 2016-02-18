(() => {

    /**
     * @ngdoc function
     * @name configBlock
     * @module app.core
     * @description
     *
     * The `configBlock` does three things right now:
     * - configure translation provider by prepping static loader (and optionally setting preferred language if we know what it is),
     * - configure theme colours for angular material
     */
    angular
        .module('app.core')
        .config(configBlock);

    function configBlock($translateProvider, $mdThemingProvider, $mdIconProvider) {

        configureTranslations();
        configureTheme();
        configureIconsets();

        /**
         * Configure angular translation provider. Set locale files location and file name pattern.
         */
        function configureTranslations() {
            $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
            $translateProvider.useStaticFilesLoader({
                prefix: './locales/',
                suffix: '/translation.json'
            });

            // $translateProvider.preferredLanguage('en-CA');
        }

        /**
         * Set theme colours from material desing colour palette.
         */
        function configureTheme() {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue-grey')
                .accentPalette('cyan');
        }

        /**
         * Adds svg iconsets to the md icon provider.
         */
        function configureIconsets() {
            $mdIconProvider
                .iconSet('action', 'content/images/iconsets/action-icons.svg', 24)
                .iconSet('alert', 'content/images/iconsets/alert-icons.svg', 24)
                .iconSet('av', 'content/images/iconsets/av-icons.svg', 24)
                .iconSet('communication',
                    'content/images/iconsets/communication-icons.svg', 24)
                .iconSet('community', 'content/images/iconsets/mdi-icons.svg', 24)
                .iconSet('content', 'content/images/iconsets/content-icons.svg', 24)
                .iconSet('device', 'content/images/iconsets/device-icons.svg', 24)
                .iconSet('editor', 'content/images/iconsets/editor-icons.svg', 24)
                .iconSet('file', 'content/images/iconsets/file-icons.svg', 24)
                .iconSet('hardware', 'content/images/iconsets/hardware-icons.svg', 24)
                .iconSet('icons', 'content/images/iconsets/icons-icons.svg', 24)
                .iconSet('image', 'content/images/iconsets/image-icons.svg', 24)
                .iconSet('maps', 'content/images/iconsets/maps-icons.svg', 24)
                .iconSet('navigation', 'content/images/iconsets/navigation-icons.svg',
                    24)
                .iconSet('notification',
                    'content/images/iconsets/notification-icons.svg', 24)
                .iconSet('social', 'content/images/iconsets/social-icons.svg', 24)
                .iconSet('toggle', 'content/images/iconsets/toggle-icons.svg', 24);
        }
    }
})();
