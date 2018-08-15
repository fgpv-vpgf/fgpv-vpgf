const templateUrl = require('./expand-menu.html');

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

    self.expandAllLegendEntries = () =>
        toggleLegendGroupEntries();
    self.collapseAllLegendEntries = () =>
        toggleLegendGroupEntries(false);

    events.$on(events.rvMapLoaded, () => {
        //wire in a hook to any map to toggleLegendEntries
        configService.getSync.map.instance.toggleLegendGroupEntries = (value = true) => {
            toggleLegendGroupEntries(value);
        }
    });

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
        if (!_legendBlocksReadyCheck()) {
            return;
        }

        const mapConfig = configService.getSync.map;
        mapConfig.legendBlocks.walk(block => {
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
        if (!_legendBlocksReadyCheck()) {
            return;
        }

        const mapConfig = configService.getSync.map;
        const isAllExpanded = configService.getSync.map.legendBlocks
            .walk(block =>
                block.blockType === LegendBlock.TYPES.GROUP ? block.expanded : null)
            .filter(expanded =>
                expanded !== null)
            .every(expanded =>
                expanded === value);

        return isAllExpanded;
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
