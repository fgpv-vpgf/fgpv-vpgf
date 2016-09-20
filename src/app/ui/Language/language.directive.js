(() => {
    'use strict';

    /**
     * @module rvLanguage
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvLanguage` directive let user switch language from the viewer.
     *
     */
    angular
        .module('app.ui.language')
        .directive('rvLanguage', rvLanguage);

    /**
     * `rvLanguage` directive body.
     *
     * @function rvLanguage
     * @return {object} directive body
     */
    function rvLanguage() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/language/language.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($rootElement, reloadService, translations, configService, sideNavigationService) {
        'ngInject';
        const self = this;

        // get languages available from configService
        const langs = configService.getLanguages();

        // set the current language
        self.currLang = configService.currentLang();

        // build the selection of available languages
        self.languages = [];
        setLanguageMenu(langs);

        self.switchLanguage = switchLanguage;

        /**
         * Switch language
         *
         * @function switchLanguage
         * @param {String} value the language to switch to
         */
        function switchLanguage(value) {
            // reload service with the new language and close side panel
            reloadService.loadNewLang(value);
            sideNavigationService.close();

            // set current language
            self.currLang = value;
        }

        /**
         * Generate the language selector menu
         *
         * @function setLanguageMenu
         * @param {Array} langs the available languages
         */
        function setLanguageMenu(langs) {
            langs.forEach(language => {
                self.languages.push({ label: translations[language].lang[language.substring(0, 2)],
                    value: language });
            });
        }
    }
})();
