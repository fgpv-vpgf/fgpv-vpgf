(() => {
    'use strict';

    /**
     * @module rvTocVisibilityMenu
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvTocVisibilityMenu` directive description.
     * TODO: add description
     *
     */
    angular
        .module('app.ui')
        .directive('rvTocVisibilityMenu', rvTocVisibilityMenu);

    function rvTocVisibilityMenu() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/templates/visibility-menu.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(geoService, appInfo) {
        'ngInject';
        const self = this;

        self.appID = appInfo.id;

        self.showAllLegendEntries = () => toggleLegendEntries();
        self.hideAllLegendEntries = () => toggleLegendEntries(false)

        self.isAllLegendEntriesVisible = () => getLegendEntriesVisibility();
        self.isAllLegendEntriesHidden = () => getLegendEntriesVisibility(false);

        /***/

        /**
         * Sets the visibility of all legend entries based on the provided value.
         * @function toggleLegendEntries
         * @private
         * @param {Boolean} value [optional = true] if true, sets visibility of all entries (groups and leafs) to true; if false, sets visibility to false
         */
        function toggleLegendEntries(value = true) {
            if (!geoService.isMapReady) {
                return;
            }

            geoService.legend.items.forEach(item =>
                item.setVisibility(value));
        }

        /**
         * Checks if all the legend entries are visible or hidden based on the supplied value.
         *
         * @function getLegendEntriesVisibility
         * @param {Boolean} value [optional = true] if true, checks if all entreis are visible; if false, if all are hidden.
         * @return {Boolean} value indicating if the check passed (all either visible or hidden)
         */
        function getLegendEntriesVisibility(value = true) {
            if (!geoService.isMapReady) {
                return;
            }

            return geoService.legend
                .walkItems(item =>
                    (item.getVisibility()), true)
                .every(item =>
                    (item === value));
        }
    }
})();
