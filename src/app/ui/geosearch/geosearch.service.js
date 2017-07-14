/**
 * @module geosearchService
 * @memberof app.ui
 * @description
 *
 * The `geosearchService` is responsible for opening and closing geosearch panel and for running queries.
 *
 */
angular
    .module('app.ui')
    .factory('geosearchService', geosearchService);

function geosearchService($q, $rootScope, stateManager, layoutService, geoSearch, events, debounceService) {

    const service = {
        isLoading: false, // waiting for results
        isResultsVisible: false, // showing results when we get some
        noResultsSearchValue: '', // the (previous) search term which returned no results

        searchValue: '', // current search term
        searchValuePerm: '', // searchValue is cleared on esc, keep a reference
        searchResults: [], // currect search results

        runQuery,

        toggle: toggleBuilder(),
        onClose,
        zoomTo
    };

    const ref = {
        mainPanel: layoutService.panels.shell.find('[rv-state=main]'),

        runningRequestCount: 0 // used to track the latest query and discard results from previous ones if they resolve after an older query
    };

    // this is horrible, but `onCloseCallback` stateManager function doesn't work correctly
    $rootScope.$watch(() => stateManager.state.mainGeosearch.active, newValue => {
        if (!newValue) {
            // this will properly hide geosearch content
            onClose();

            // emit close to directive
            $rootScope.$emit(events.rvGeosearchClose);
        }
    });

    return service;

    /**
     * Builds a debounced toggle function to open and close geosearch content
     *
     * @function toggleBuilder
     * @private
     * @return {Function} a geosearch toggle function
     */
    function toggleBuilder() {
        return debounceService.registerDebounce(() => {
            ref.mainPanel.addClass('geosearch');

            // skip animation on the main panel when switching to and from geosearch content
            stateManager.state.main.activeSkip = true;
            stateManager.state.main.activeSkipOverride = true;

            stateManager.setActive({ side: false }, 'mainGeosearch');
        });
    }

    /**
     * Properly closes the geosearch content and restores previous panel if any. Do not clear the search term when closing
     * so when user come back he doesn't lose is search. Especially useful for small screen.
     *
     * @function onClose
     */
    function onClose() {
        // because search value is cleared on esc, reset it to make permanent when we close geosearch
        service.searchValue = service.searchValuePerm;

        // stateManager is a mess; it needs to be refactored; this won't happen.

        // check if another panel was open before opening geosearch
        // if table is open, toggle mainToc otherwise the last panel
        // if not, only close geosearch
        const panels = stateManager.panelHistory;
        if (panels.length > 0) {
            stateManager.state.main.activeSkipOverride = false;

            const toPanel = panels.reverse().find(item =>
                item === 'mainToc' || item === 'mainDetails');

            stateManager.setActive({ [toPanel]: true });
        } else {
            stateManager.setActive({ main: false })
                .then(() => {
                    stateManager.state.main.activeSkipOverride = false;
                });
        }

        // remove class to set back "main panel goes to bottom"
        ref.mainPanel.removeClass('geosearch');
    }

    /**
     * Runs geosearch query and returns the results or suggestions.
     *
     * @function runQuery
     * @return {Promise} promise resolving with results (when results are found - { results: [] }) or suggestions (when results are not found - { suggestions: [] }) or nothing (when search value is not specified - {});
     */
    function runQuery() {
        const requestCount = ++ref.runningRequestCount;

        // skip when the search value is not specified
        if (!service.searchValue) {

            service.searchResults = [];
            service.isLoading = false;
            service.isResultsVisible = false;

            return $q.resolve();
        }

        // show loading indicator
        service.isLoading = true;

        return geoSearch.query(`${service.searchValue}*`).then(data => {

            // hide loading indicator
            service.isLoading = false;
            service.isResultsVisible = true;

            // discard any old results
            if (requestCount === ref.runningRequestCount) {
                service.searchResults = data.results || [];

                service.noResultsSearchValue = service.searchResults.length === 0 ? service.searchValue : '';
            }

            // return data for optional processing further down the promise chain
            return data;
        });
    }

    /**
     * @function zoomTo
     * @param {Object} result a search result to zoom to
     */
    function zoomTo(result) {
        if (typeof result.bbox !== 'undefined') {
            geoSearch.zoomSearchExtent(result.bbox, result.position);
        } else {
            // zoom to a scale
            // name contain the search value inside result panel
            // in the case of a scale, it will be something like 1:100 000 (geo-search.service.js line 334)
            geoSearch.zoomScale(result.name.split(':')[1]);
        }
    }
}
