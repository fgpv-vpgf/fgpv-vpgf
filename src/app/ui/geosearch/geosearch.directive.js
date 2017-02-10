/* global RV */
(() => {
    'use strict';

    /**
     * @module rvGeosearch
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvGeosearch` directive let user enter text for a geolocation search.
     *
     */
    angular
        .module('app.ui')
        .directive('rvGeosearch', rvGeosearch);

    /**
     * `rvGeosearch` directive body.
     *
     * @function rvGeosearch
     * @return {object} directive body
     */
    function rvGeosearch(storageService, layoutService, debounceService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/geosearch/geosearch.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true,
            link: (scope, element) => {

                // https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1668
                // IE requires a specific fix because it will not size a flex child's height correctly unless its parent has a set height (not percentage); so the height is set explicitly every time the main panel height changes;
                // read here for more details http://stackoverflow.com/a/35537510
                // tecnhically, this fix will work for all browsers, but it's ugly and should be reserved for IE only; other browsers are fixes using CSS just fine;
                if (RV.isIE) {
                    const geosearchContentNode = element.find('.rv-geosearch-content:first');

                    const debounceUpdateMaxHeight = debounceService.registerDebounce(newDimensions =>
                        geosearchContentNode.css('max-height', newDimensions.height - 10), 175, false, true); // 10 accounts for top margin :()

                    layoutService.onResize(storageService.panels.main, debounceUpdateMaxHeight);
                }
            }
        };

        return directive;
    }

    function Controller(geosearchService, events) {
        'ngInject';
        const self = this;

        self.service = geosearchService;

        const ref = {
            extentChangeListener: angular.noop
        };

        self.onTopFiltersUpdate = onTopFiltersUpdate;
        self.onBottomFiltersUpdate = onBottomFiltersUpdate;

        return;

        /**
         * Triggers geosearch query on top filters (province, type) update.
         *
         * @function onTopFiltersUpdate
         * @private
         */
        function onTopFiltersUpdate() {
            geosearchService.runQuery();
        }

        /**
         * Triggers geosearch query on top filters (show only items visible in the current extent) update.
         *
         * @function onBottomFiltersUpdate
         * @private
         */
        function onBottomFiltersUpdate(visibleOnly) {
            if (visibleOnly) {
                ref.extentChangeListener = events.$on(events.rvExtentChange, geosearchService.runQuery);
            } else {
                ref.extentChangeListener(); // unsubscribe from the listener
            }

            // also run query once on each filters update to refresh the results
            geosearchService.runQuery();
        }
    }
})();
