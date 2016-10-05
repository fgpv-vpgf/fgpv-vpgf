(() => {
    'use strict';

    /**
     * @module geosearchService
     * @memberof app.ui
     * @description
     *
     * The `geosearchService` is responsible for applying geosearch
     *
     */
    angular
        .module('app.ui.geosearch')
        .factory('geosearchService', geosearchService);

    function geosearchService(stateManager, storageService, debounceService, geoSearch, $rootScope, geoService) {

        // main panel to know where to switch when we close geosearch
        const mainPanel = storageService.panels.shell.find('[rv-state=main]');

        // the extent change event watch
        let extentEvent;

        // debounce the toggle geosearch button to avoid wierd behaviour
        const debToggleGeo = debounceService.registerDebounce(() => {
            stateManager.setActive({ side: false }, 'mainGeosearch');
            mainPanel.addClass('rv-geosearch-filters');

            // validate extent to see if visible filter should be disableSearch
            validateExtent();

            if (extentEvent) {
                // deregister the event listener
                extentEvent();
                extentEvent = undefined;
            } else {
                // subscribe to 'extentChange' event only if the handle is undefined
                extentEvent = $rootScope.$on('extentChange',
                    debounceService.registerDebounce(onExtentChange, 300, false));
            }
        });

        // filters values from geoSearch to be use in geosearch-filters
        const filters = {
            provinces: [],
            types: [],
            extent: {
                value: false,
                outside: false,
                selection: false
            }
        };

        // text value to search for
        const searchText = {
             value: ''
         };

        // hold results from the search
        const results = {
             values: { }
         };

        const service = {
            filters,
            searchText,
            results,
            zoomSearchExtent,
            queryGeosearch,
            clearSearch,
            getProvinces,
            getTypes,
            setProvince,
            setType,
            setExtent,
            toggleToc,
            toggleGeosearch
        };

        stateManager.setCloseCallback('mainGeosearch', closeGeosearch);

        init();

        return service;

        /************************/

        /**
         * Set the geosearch extent filters values and set extent-change event.
         *
         * @function init
         * @private
         */
        function init() {
            // set show visible filter (extent)
            geoSearch.setExtent('canada');
        }

        /**
         * Zoom to geosearch selection.
         *
         * @function zoomSearchExtent
         * @private
         * @param   {Object}    item  the item to zoom to.
         */
        function zoomSearchExtent(item) {
            geoSearch.zoomSearchExtent(item.bbox, item.position);
        }

        /**
         * Query results for geaosearch text from geo-search.service
         *
         * @function queryGeosearch
         */
        function queryGeosearch() {
            // query only if there is a least 3 characters, otherwise clear results array to clear content.
            if (searchText.value.length > 2) {
                // if there is results, show them. If not, clear results array to clear content.
                // add * wildcard to the query to make sure we always have results. If not something like
                // vancouv will return no result.
                geoSearch.query(`${searchText.value}*`).then((items) => setResults(items))
                    .then((response) => results.values = response);
            } else {
                results.values = [];
            }
        }

        /**
         * Set results object with reponse from the query to show them in geosearch-content.
         *
         * @function setResults
         * @private
         * @param   {Array} items   the items array to show in geosearch-content panel.
         * @return  {Array} results the results from the query (empty array if there is no results)
         */
        function setResults(items) {
            if (items.results === undefined) {
                return [];
            }

            // extract usefull informations for every item in the array
            return items.results.map((item) => ({
                name: item.name,
                location: `, ${item.location.province.name.split(',')[0]} ${(item.location.city !== null) ?
                    `, ${item.location.city}` : ''}`,
                type: item.type.name,
                bbox: item.bbox,
                position: item.position
            }));
        }

        /**
         * Called on map extent changes to refresh query if extent is not canada
         *
         * @function onExtentChange
         * @private
         */
        function onExtentChange() {
            validateExtent();

            if (filters.extent.value && searchText.value !== '') {
                queryGeosearch();
            }
        }

        function validateExtent() {
            // check if visibile extent is inside full extent. If not, disable
            // extent filters and use full extent.
            if (!geoService.validateExtent(1.15)) {
                filters.extent.value = false;
                filters.extent.outside = true;
                geoSearch.setExtent('canada');
            } else {
                filters.extent.value = filters.extent.selection;
                filters.extent.outside = false;
                geoSearch.setExtent((filters.extent.value) ? 'visible' : 'canada');
            }
        }

        /**
         * Clear search text and results values when user click on the close icon from the geosearch text entry
         *
         * @function clearSearch
         */
        function clearSearch() {
            searchText.value = '';
            results.values = [];
        }

        /**
         * Set provinces filter values from geo-search.service
         *
         * @function getProvinces
         */
        function getProvinces() {
            // only call if filters is empty
            if (!filters.provinces.length) {
                // get and set province filter
                geoSearch.getProvinces().then((values) => {
                    values.forEach((obj) => {
                        filters.provinces.push(obj.name);
                    });
                });
            }
        }

        /**
         * Set types filter values from geo-search.service
         *
         * @function getTypes
         */
        function getTypes() {
            // only call if filters is empty
            if (!filters.types.length) {
                // get and set type filter
                geoSearch.getTypes().then((values) => {
                    values.forEach((obj) => {
                        filters.types.push(obj.name);
                    });
                });
            }
        }

        /**
         * Set the province code from the province name then query geosearch for updated results.
         *
         * @function setProvince
         * @param   {String}    value   the province filter value.
         */
        function setProvince(value) {
            geoSearch.getProvinces().then((provinces) => provinces.find((province) => province.name === value))
                .then((result) => {
                    geoSearch.setProvince(value !== 'Province' ? result.code : undefined);
                    queryGeosearch();
                }
            );
        }

        /**
         * Set the type code from the type name then query geosearch for updated results.
         *
         * @function setType
         * @param   {String}    value   the type filter value.
         */
        function setType(value) {
            geoSearch.getTypes().then((types) => types.find((type) => type.name === value))
                .then((result) => {
                    geoSearch.setType(value !== 'Type' ? result.code : undefined);
                    queryGeosearch();
                }
            );
        }

        /**
         * Set the extent value then query geosearch for updated results.
         *
         * @function setExtent
         * @param   {String}    value   the extent filter value.
         */
        function setExtent(value) {
            filters.extent.selection = value;
            geoSearch.setExtent((value) ? 'visible' : 'canada');
            queryGeosearch();
        }

        /**
         * Close geosearch panel and open toc panel.
         *
         * @function toggleToc
         */
        function toggleToc() {
            stateManager.setActive({ mainGeosearch: false }, 'mainToc');
        }

        /**
         * Toggle geosearch panel. Use debounce function to avoid wierd behaviour when click
         * repetitively
         *
         * @function toggleGeosearch
         */
        function toggleGeosearch() {
            debToggleGeo();
        }

        /**
         * Closes geosearch pane and switches to the previous pane if any.
         * @function closeGeosearch
         * @private
         */
        function closeGeosearch() {
            // remove class to set back "main panel goes to bottom"
            mainPanel.removeClass('rv-geosearch-filters');

            // check if another panel was open before opening geosearch
            // if filters is open, toggle mainToc otherwise the last panel
            // if not, only close geosearch
            const panels = stateManager.panelHistory;
            if (panels.length > 1) {
                stateManager.togglePanel('mainGeosearch',
                    (panels.find((item) => { return item === 'filtersFulldata'; }) === undefined) ?
                        panels[panels.length - 2] : 'mainToc');
            } else {
                stateManager.setActive({ mainGeosearch: false });
            }
        }
    }
})();
