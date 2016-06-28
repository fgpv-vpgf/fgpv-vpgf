(() => {

    angular
        .module('app.core')
        .config(configBlock);

    /**
     * @memberof app.core
     * @function configBlock
     * @private
     * @description
     *
     * The `configBlock` does three things right now:
     * - configure translation provider by prepping static loader (and optionally setting preferred language if we know what it is),
     * - configure theme colours for angular material
     */
    function configBlock($translateProvider, $mdThemingProvider, $mdIconProvider, translations) {

        configureTranslations();
        configureTheme();
        configureIconsets();

        /**
         * Configure angular translation provider. Set locale files location and file name pattern.
         * @inner
         * @memberof app.core
         * @function
         */
        function configureTranslations() {
            $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
            Object.keys(translations).forEach(locale => $translateProvider.translations(locale, translations[locale]));

            // $translateProvider.preferredLanguage('en-CA');
        }

        /**
         * Set theme colours from material desing colour palette.
         * @inner
         * @memberof app.core
         * @function
         */
        function configureTheme() {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue-grey')
                .accentPalette('cyan');
        }

        /**
         * Adds svg iconsets to the md icon provider.
         * @inner
         * @memberof app.core
         * @function
         */
        function configureIconsets() {
            // default icon set is needed because some of Angular Material directives have hardcoded svg icon names;
            // radio menu options use `check` icon which can be found in `navigation` icon set; since there is no easy way of overriding the icon name, the default icon set will have duplicates needed by such directives
            // NOTE use the gulp makesvgcache task to add new icons
            $mdIconProvider
                .defaultIconSet('app/default.svg')
                .iconSet('action', 'app/action.svg')
                .iconSet('alert', 'app/alert.svg')
                .iconSet('communication', 'app/communication.svg')
                .iconSet('community', 'app/community.svg')
                .iconSet('content', 'app/content.svg')
                .iconSet('editor', 'app/editor.svg')
                .iconSet('file', 'app/file.svg')
                .iconSet('hardware', 'app/hardware.svg')
                .iconSet('image', 'app/image.svg')
                .iconSet('maps', 'app/maps.svg')
                .iconSet('navigation', 'app/navigation.svg')
                .iconSet('social', 'app/social.svg');
        }
    }
})();
