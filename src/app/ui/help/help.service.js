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

            // no searchTerm provided, return all html
            if (!searchTerm) {
                return $sce.trustAsHtml(text);
            }

            // Regex in javascript is not capable of searching html text while avoiding matches
            // on the element attributes. To accomplish this, we render the text html as a DOM tree,
            // then search the DOM tree for text nodes. We then look for the searchTerm within these
            // textNodes so that elements and their attributes are not affected
            const htmlFragment = document.createDocumentFragment();
            const searchElement = document.createElement('div');
            searchTerm = searchTerm.toLowerCase(); // case insensitive search

            // Turn HTML text provided into a DOM searchable tree
            searchElement.innerHTML = text;
            // Recursively search tree for text node
            findTextNodes(searchElement);
            // tree is now searched - append results to html fragment
            htmlFragment.appendChild(searchElement);

            /**
            * Given some node it searches the node and its children for textNodes, which are sent to doSearch for searching
            *
            * @function findTextNodes
            * @param {Object} node    node to search for textNodes
            */
            function findTextNodes(node) {
                let childNode;
                let nextNode;
                // document, document fragment, or element recurse search
                if ([1, 9, 11].find(n => n === node.nodeType)) {
                    childNode = node.firstChild;
                    while (childNode) {
                        nextNode = childNode.nextSibling;
                        findTextNodes(childNode);
                        childNode = nextNode;
                    }
                // found a text node - perform search on it
                } else if (node.nodeType === 3) {
                    doSearch(node);
                }
            }

            /**
            * Given a textnode, wraps the searchTerm in a span element so that it is visible to the user
            *
            * @function doSearch
            * @param {Object} preMatch    textNode to be searched
            */
            function doSearch(preMatch) {
                // try to find search term index in the preMatch
                const searchIndex = preMatch.nodeValue.toLowerCase().indexOf(searchTerm);
                if (searchIndex !== -1) { // found a match, continuing
                    let match; // contains only the matched text
                    let postMatch; // contains text after the match
                    // this next part can be confusing - but this is the general idea:
                    //   - preMatch first contains the entire textNode
                    //   - match is then assigned all text prior to the search term
                    //   - preMatch then contains the search term and all text after it
                    //   - postMatch is then assigned all text after the match, which leaves match with, well, the match
                    match = preMatch.splitText(searchIndex);
                    postMatch = match.splitText(searchTerm.length);

                    const span = document.createElement('span');
                    span.className = className;
                    // now bring together split pieces including wrapped search term
                    preMatch.parentNode.insertBefore(span, postMatch);
                    span.appendChild(match);
                }
            }

            return $sce.trustAsHtml(searchElement.innerHTML);
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
