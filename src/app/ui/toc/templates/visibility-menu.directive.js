const templateUrl = require('./visibility-menu.html');

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
        templateUrl,
        scope: {
            disabled: '='
        },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(LegendBlock, geoService, appInfo, configService, events) {
    'ngInject';
    const self = this;

    self.appID = appInfo.id;

    self.showAllLegendEntries = () =>
        toggleLegendEntries();
    self.hideAllLegendEntries = () =>
        toggleLegendEntries(false);

    events.$on(events.rvMapLoaded, () => {
        //wire in a hook to any map to toggleLegendEntries
        configService.getSync.map.instance.toggleLegendEntries = (value = true) => {
            toggleLegendEntries(value);
        }
    });

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
        if (!_legendBlocksReadyCheck()) {
            return;
        }

        // set visibility on all interactive legend blocks, but do not set visibility on children of LegendSets;
        // if we do set visibility on LegendSet's children, the last child in the set will be selected as opposed to the first one;
        const mapConfig = configService.getSync.map;
        mapConfig.legendBlocks
            .walk(_walkAction, _walkDecision);

        // TODO: think about if this should toggle visiblity of legend blocks whose controls are disabled/userdisabled
        function _walkAction(block) {
            if (block.isInteractive && !block.hidden) {
                if (block.symbologyStack && block.symbologyStack.toggleList && block.symbologyStack.toggleList.length > 1) {
                    block.symbologyStack.toggleList.forEach(toggle => {
                        toggle.wasSelected = true;
                    });
                }
                block.visibility = value;
            }
        }

        function _walkDecision(block) {
            return block.blockType === LegendBlock.TYPES.GROUP;
        }
    }

    /**
     * Checks if all the legend entries are visible or hidden based on the supplied value.
     * An entry is considered fully visible iff all its symbologies are visible.
     *
     * @function getLegendEntriesVisibility
     * @param {Boolean} value [optional = true] if true, checks if all entreis are visible; if false, if all are hidden.
     * @return {Boolean} value indicating if the check passed (all either visible or hidden)
     */
    function getLegendEntriesVisibility(value = true) {
        if (!_legendBlocksReadyCheck()) {
            return;
        }

        // find all interactive legendblocks whose visibility controls are not system disabled and aggregate their visibility
        const mapConfig = configService.getSync.map;
        const isAllVisible = mapConfig.legendBlocks
            .walk(block => {
                if (!block.isInteractive || block.hidden) {
                    return null;
                }

                // TODO: the logic is not entirely correct as a group with only legend info blocks and disabled controls still have visiblity
                // this causes the visibility menu not disable options correctly
                if (block.symbologyStack && block.symbologyStack.toggleList && block.symbologyStack.toggleList.length > 1) {
                    return block.isControlSystemDisabled('visibility') ? null : value ? block.fullyVisible : !block.fullyInvisible;
                } else {
                    return block.isControlSystemDisabled('visibility') ? null : block.visibility;
                }
            })
            .filter(isVisible =>
                isVisible !== null)
            .every(isVisible =>
                isVisible === value);

        return isAllVisible;
    }

    /**
     * Checks if the legendBlocks hierarchy is initialized; false otherwise
     *
     * @function _legendBlocksReadyCheck
     * @private
     * @return {Boolean} true if the legendBlocks hierarchy is initialized; false otherwise
     */
    function _legendBlocksReadyCheck() {
        if (!geoService.isMapReady) {
            return false;
        }

        const config = configService.getSync;

        if (typeof config === 'undefined' || config.map.legendBlocks === null) {
            return false;
        }

        return true;
    }
}
