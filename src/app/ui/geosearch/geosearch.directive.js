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
    function rvGeosearch() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/geosearch/geosearch.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
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
