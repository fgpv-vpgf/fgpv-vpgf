const templateUrl = require('./settings-content.html');

/**
 * @module rvSettingsContent
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvSettingsContent` directive renders the data content of details.
 * To improve efficency a document fragment is first created prior to
 * DOM insertion.
 *
 */
angular
    .module('app.ui')
    .directive('rvSettingsContent', rvSettingsContent);

/**
 * `rvSettingsContent` directive body.
 *
 * @function rvSettingsContent
 * @return {object} directive body
 */
function rvSettingsContent(layerRegistry) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            block: '='
        },
        link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope) {
        const self = scope.self;

        const opacityName = 'opacity';
        const intervalName = 'interval';
        const layerRecord = layerRegistry.getLayerRecord(self.block.layerRecordId);

        // only search for opacity parent if the control is userDisabled on non-true-dynamic dynamic layers
        if (self.block.isControlUserDisabled(opacityName) && !layerRecord.isTrueDynamic) {
            self.opacityValueParentBlock = findParentBlock(self.block, opacityName);
        }

        // only search for interval parent if the control is userDisabled on non-true-dynamic dynamic layers
        if (self.block.isControlUserDisabled(intervalName) && !layerRecord.isTrueDynamic) {
            self.refreshValueParentBlock = findParentBlock(self.block, intervalName);
        }

        /**
         * Finds the closes parent group which enabled and visible given control.
         *
         * @function findParentBlock
         * @private
         * @param {LegendBlock} block
         * @param {String} control
         * @return {LegendBlock|null} a LegendBlock group or null if the parent doesn't exist
         */
        function findParentBlock(block, control) {

            const parent = block.visualParent;

            // the root of the legend doesn't have a parent or any visual representation, ignore it
            if (!parent || !parent.parent) {
                return null;
            }

            if (!parent.isControlDisabled(control) && parent.isControlVisible(control)) {
                return parent;
            } else {
                return findParentBlock(parent, control);
            }
        }
    }
}

function Controller(common, Geo, LegendBlock, tocService, layerRegistry) {
    'ngInject';
    const self = this;

    self.checkAvailableControls = checkAvailableControls;
    self.checkDisabledControls = checkDisabledControls;
    self.checkWMS = checkWMS;
    self.checkStylesLength = checkStylesLength;

    self.isFileLayer = () => layerRegistry.getLayerRecord(self.block.layerRecordId).isFileLayer();

    /**
     * @function checkAvailableControls
     * @private
     * @param {String} names
     * @return {Boolean} true if at least one of the supplied control names is available in block
     */
    function checkAvailableControls(names) {
        return common.intersect(self.block.availableControls, names.split('|')).length > 0;
    }

    /**
     * @function checkDisabledControls
     * @private
     * @param {String} names
     * @return {Boolean} true if at least one of the supplied control names is disabled in block
     */
    function checkDisabledControls(names) {
        return common.intersect(self.block.disabledControls, names.split('|')).length > 0;
    }

    /**
     * @function checkWMS
     * @private
     * @return {Boolean} true if the block is a WMS layer
     */
    function checkWMS() {
        return self.block.layerType === Geo.Layer.Types.OGC_WMS;
    }

    /**
     * @function checkStylesLength
     * @private
     * @return {Boolean} true if some sublayer has more than 1 style (only for WMS)
     */
    function checkStylesLength() {
        return self.block.mainProxyWrapper.layerConfig.layerEntries.some(entry => entry.allStyles.length > 1);
    }
}
