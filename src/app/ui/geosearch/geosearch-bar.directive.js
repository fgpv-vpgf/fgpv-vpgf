const templateUrl = require('./geosearch-bar.html');

const GEOSEARCH_MENU_CLASS = 'rv-geosearch-suggestion-menu';

/**
 * @module rvGeosearchBar
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvGeosearchBar` directive creates the geobar with a search field and the close button.
 *
 */
angular
    .module('app.ui')
    .directive('rvGeosearchBar', rvGeosearchBar);

/**
 * `rvGeosearch` directive body.
 *
 * @function rvGeosearch
 * @return {object} directive body
 */
function rvGeosearchBar() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            value: '=',
            onUpdate: '=',
            onClose: '='
        },
        link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, el) {
        // auto focus on the search field when created
        el.find('md-autocomplete').rvFocus();
    }
}

function Controller(appInfo, configService, sideNavigationService, debounceService, geosearchService) {
    'ngInject';
    const self = this;

    const ref = {
        _geosearchMenuNode: null
    };

    self.service = geosearchService;

    self.geosearchMenuClass = GEOSEARCH_MENU_CLASS;
    self.sideNavigationService = sideNavigationService;
    self.searchLength = 0;

    self.onUpdateDebounce = onUpdateDebounceBuilder();

    configService.onEveryConfigLoad(cfg =>
        (self.config = cfg));

    return;

    /***/

    /**
     * Create a debounced getSuggestions function which also hides suggestions menu when the search query is being run.
     *
     * @function onUpdateDebounceBuilder
     * @private
     * @return {Function} debounced onUpdateFunction
     */
    function onUpdateDebounceBuilder() {

        const onUpdateDebounce = debounceService.registerDebounce(getSuggestions, 300, false);

        return () => {
            // because search value is cleared on esc, keep a reference if not empty or empty but user erase it
            const prevLength = self.searchLength;
            const actualLength = self.service.searchValue.length;
            if (self.service.searchValue !== '' || (prevLength === 1 && actualLength === 0)) {
                self.service.searchValuePerm = self.service.searchValue;
            }
            self.searchLength = self.service.searchValue.length;

            getGeosearchMenuNode().css('visibility', 'hidden');

            return onUpdateDebounce().then(data => {
                getGeosearchMenuNode().css('visibility', 'visible');

                return data;
            });
        };
    }

    /**
     * Finds and returns a node of the autocomplete suggestion menu.
     *
     * @function getGeosearchMenuNode
     * @private
     * @return {Object} autocomplete suggestion menu node
     */
    function getGeosearchMenuNode() {
        if (!ref._geosearchMenuNode || ref._geosearchMenuNode.length === 0) {
            ref._geosearchMenuNode = angular
                .element(`.${GEOSEARCH_MENU_CLASS}`)
                .parents('md-virtual-repeat-container')
                .attr('rv-trap-focus', appInfo.id);
        }

        return ref._geosearchMenuNode;
    }

    /**
     * Runs a geosearch query and returns a promise resolving with suggestions if any
     *
     * @function getSuggestions
     * @private
     * @return {Promise} a promise resolving with geo search query suggestion if any
     */
    function getSuggestions() {
        const suggestionsPromise = geosearchService.runQuery().then((data = {}) =>
            data.suggestions || []
        );

        return suggestionsPromise;
    }
}
