/* global marked */
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
        function HelpSummaryController($http, configService) {
            const self = this;

            self.closeHelpSummary = closeHelpSummary;
            self.onSearchTermChange = onSearchTermChange;
            self.filteredSections = [];

            const renderer = new marked.Renderer();
            // make it easier to use images in markdown by prepending path to href if href is not an external source
            // this avoids the need for ![](help/images/myimg.png) to just ![](myimg.png). This overrides the default image renderer completely.
            renderer.image = (href, title) => {
                if (href.indexOf('http') === -1) {
                    href = 'help/images/' + href;
                }
                return `<img src="${href}" alt="${title}">`;
            };

            const mdLocation = `help/${configService.currentLang()}.md`;
            $http.get(mdLocation).then(r => {
                // matches help sections from markdown file where each section begins with one hashbang and a space
                // followed by the section header, exactly 2 spaces, then up to but not including a double space
                // note that the {2,} below is used as the double line deparator since each double new line is actually 6
                // but we'll also accept more than a double space
                const reg = /^#\s(.*)\n{2}(?:.*|\n(?!\n{2,}))*/gm;
                let mdStr = r.data; // markdown file contents
                let section; // used for storing individual section groupings
                self.sections = []; // used in template for rendering help sections

                // remove new line character ASCII (13) so that above regex is compatible with all
                // operating systems (markdown file varies by OS new line preference)
                mdStr = mdStr.replace(new RegExp(String.fromCharCode(13), 'g'), '');

                // start breaking down markdown file into sections where h1 headers (#) denote a new section
                while (section = reg.exec(mdStr)) { // jshint ignore:line
                    self.sections.push({
                        header: section[1],
                        // parse markdown on info section only. Note that the split/splice/join removes the header
                        // and is a workaround for not being able to put info section into its own regex grouping like the header
                        info: marked(section[0].split('\n').splice(2).join('\n'), { renderer }),
                        isExpanded: false
                    });
                }
            });

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
