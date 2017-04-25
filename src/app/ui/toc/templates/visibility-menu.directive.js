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

        self.showAllLegendEntries = () =>
            toggleLegendEntries();
        self.hideAllLegendEntries = () =>
            toggleLegendEntries(false);

        self.isAllLegendEntriesVisible = () =>
            getLegendEntriesVisibility();
        self.isAllLegendEntriesHidden = () =>
            getLegendEntriesVisibility(false);

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

            // set visibility on all interactive legend blocks, but do not set visibility on children of LegendSets;
            // if we do set visibility on LegendSet's children, the last child in the set will be selected as opposed to the first one;
            configService._sharedConfig_.map.legendBlocks
                .walk(_walkAction, _walkDecision);

            function _walkAction(block) {
                if (block.isInteractive) {
                    block.visibility = value
                }
            }

            function _walkDecision(block) {
                return block.blockType === LegendBlock.TYPES.GROUP;
            }
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

            // find all interactive legendblocks whose visibility controls are not system disabled and aggregate their visibility
            const isAllVisible = configService._sharedConfig_.map.legendBlocks
                .walk(block => {
                    if (!block.isInteractive) {
                        return null;
                    }

                    return block.isControlSystemDisabled('visibility') ? null : block.visibility;
                })
                .filter(isVisible =>
                    isVisible !== null)
                .every(isVisible =>
                    isVisible === value);

            return isAllVisible;
        }
    }
})();
