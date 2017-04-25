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
            scope: {
                disabled: '='
            },
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(LegendBlock, geoService, appInfo, configService) {
        'ngInject';
        const self = this;

        self.appID = appInfo.id;

        self.expandAllLegendEntries = () =>
            toggleLegendGroupEntries();
        self.collapseAllLegendEntries = () =>
            toggleLegendGroupEntries(false);

        self.isAllLegendEntriesExpanded = () =>
            getLegendGroupEntriesExpandState();
        self.isAllLegendEntriesCollapsed = () =>
            getLegendGroupEntriesExpandState(false);

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

            configService._sharedConfig_.map.legendBlocks.walk(block => {
                if (block.blockType === LegendBlock.TYPES.GROUP) {
                    (block.expanded = value);
                }
            });
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

            const isAllExpanded = configService._sharedConfig_.map.legendBlocks
                .walk(block =>
                    block.blockType === LegendBlock.TYPES.GROUP ? block.expanded : null)
                .filter(expanded =>
                    expanded !== null)
                .every(expanded =>
                    expanded === value);

            return isAllExpanded;
        }
    }
})();
