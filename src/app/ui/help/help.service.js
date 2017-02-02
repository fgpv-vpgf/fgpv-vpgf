(() => {
    'use strict';

    /**
     * @module helpService
     * @memberof app.ui
     * @description
     *
     * The `helpService` service provides stores for help items
     *
     */
    /**
     * @module highlightFilter
     * @memberof app.ui
     * @description
     *
     * The `highlightFilter` filter, highlights a phrase in the supplied text.
     *
     */
    angular
        .module('app.ui.help')
        .service('helpService', helpService)
        .filter('highlight', highlightFilter);

    // TODO: this needs to be moved into a separate into ui/common folder
    function highlightFilter($sce) {
        return (text = '', searchTerm = undefined, className = 'rv-help-highlight') => {

            if (searchTerm) {
                // sanitizes a regex by removing all common RegExp identifiers
                searchTerm = searchTerm.replace(/[\\\^\$\*\+\?\.\(\)\|\{}\[\]]/g, '\\$&');

                text = text.replace(
                    new RegExp(`(${searchTerm})`, 'gi'),
                    `<span class="${className}">$1</span>`);
            }

            return $sce.trustAsHtml(text);
        };
    }

    function helpService($mdDialog, $translate, translations, storageService) {
        // all help sections (populated when elements tagged with rv-help are created)
        const registry = [];

        // all help sections currently drawn
        const drawnCache = [];

        const service = {
            register,
            unregister,
            registry,
            drawnCache,
            setDrawn,
            clearDrawn,

            open
        };

        return service;

        /**
         * Opens help panel.
         *
         * @function open
         */
        function open() {
            $mdDialog.show({
                controller: HelpSummaryController,
                controllerAs: 'self',
                bindToController: true,
                templateUrl: 'app/ui/help/help-summary.html',
                parent: storageService.panels.shell,
                disableParentScroll: false,
                clickOutsideToClose: true,
                fullscreen: false
            });
        }

        /**
        * Adds an object to the service's registry.
        *
        * @function register
        * @param {Object} object    the object to be added
        */
        function register(object) {
            registry.push(object);
        }

        /**
        * Removes an object from the service's registry.
        *
        * @function unregister
        * @param {Object} object    the object to be removed
        */
        function unregister(object) {
            const index = registry.indexOf(object);
            if (index !== -1) {
                registry.splice(index, 1);
            }
        }

        /**
        * Adds an object to the service's cache of already drawn help sections.
        *
        * @function setDrawn
        * @param {Object} object    the object to be added
        */
        function setDrawn(object) {
            drawnCache.push(object);
        }

        /**
        * Clears the service's cache of already drawn help sections.
        *
        * @function clearDrawn
        */
        function clearDrawn() {
            drawnCache.length = 0;
        }

        // FIXME add docs
        function HelpSummaryController() {
            const self = this;

            self.closeHelpSummary = closeHelpSummary;
            self.onSearchTermChange = onSearchTermChange;

            self.filteredSections = [];
            self.sections = Object.keys(translations[$translate.use()].help)
                .map(sectionName =>
                    ({
                        header: $translate.instant(`help.${sectionName}.header`),
                        info: $translate.instant(`help.${sectionName}.info`),
                        isExpanded: false
                    }));

            self.searchTerm = '';

            /**
             * Closes the Help panel.
             *
             * @function closeHelpSummary
             * @private
             */
            function closeHelpSummary() {
                $mdDialog.hide();
            }

            /**
             * When a search term is entered, expand all the help sections (only once that are filtered will be visible, so it's okay).
             * When a search term is cleared, collapse all the help sections.
             * @function onSearchTermChange
             * @private
             * @param {String} value search string
             */
            function onSearchTermChange(value) {
                self.sections.forEach(section =>
                    (section.isExpanded = value ? true : false));
            }
        }
    }
})();
