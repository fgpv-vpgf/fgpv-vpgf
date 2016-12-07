(() => {
    'use strict';

    /**
     * @module rvTocExpandMenu
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvTocExpandMenu` directive description.
     * TODO: add description
     *
     */
    angular
        .module('app.ui')
        .directive('rvTocExpandMenu', rvTocExpandMenu);

    function rvTocExpandMenu() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/templates/expand-menu.html',
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

        self.expandAllLegendEntries = () => toggleLegendGroupEntries();
        self.collapseAllLegendEntries = () => toggleLegendGroupEntries(false);

        self.isAllLegendEntriesExpanded = () => getLegendGroupEntriesExpandState();
        self.isAllLegendEntriesCollapsed = () => getLegendGroupEntriesExpandState(false);

        /***/

        /**
         * Expands or collapses all the legend group entries based on the provided value.
         * @function toggleLegendGroupEntries
         * @private
         * @param {Boolean} value [optional = true] if true, expands all the groups and subgroups; if false, collapses them
         */
        function toggleLegendGroupEntries(value = true) {
            if (!geoService.isMapReady) {
                return;
            }

            geoService.legend.walkItems(item => {
                if (item.type === 'group') {
                    item.expanded = value;
                }
            }, true);
        }

        /**
         * Checks if all the legend group entries are expanded or collapsed based on the supplied value.
         *
         * @function getLegendGroupEntriesExpandState
         * @param {Boolean} value [optional = true] if true, checks if all groups are expanded; if false, if all are collapsed.
         * @return {Boolean} value indicating if the check passed (all either expanded or collapsed)
         */
        function getLegendGroupEntriesExpandState(value = true) {
            if (!geoService.isMapReady) {
                return;
            }

            return geoService.legend
                .walkItems(item =>
                    (item.expanded), true) // leaf entries will return "undefined"
                .filter(item =>
                    (typeof item !== 'undefined')) // filter out leaf entries
                .every(item =>
                    (item === value));
        }
    }
})();
