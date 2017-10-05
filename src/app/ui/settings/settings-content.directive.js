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
        const layerRecord = layerRegistry.getLayerRecord(self.block.layerRecordId);

        // only search for opacity parent if the control is userDisabled on non-true-dynamic dynamic layers
        if (self.block.isControlUserDisabled(opacityName) && !layerRecord.isTrueDynamic) {
            self.valueParentBlock = findOpacityParentBlock(self.block);
        }

        /**
         * Finds the closes parent group which enabled and visible opacity control.
         *
         * @function findOpacityParentBlock
         * @private
         * @param {LegendBlock} block
         * @return {LegendBlock|null} a LegendBlock group or null if the parent doesn't exist
         */
        function findOpacityParentBlock(block) {

            const parent = block.visualParent;

            // the root of the legend doesn't have a parent or any visual representation, ignore it
            if (!parent || !parent.parent) {
                return null;
            }

            if (!parent.isControlDisabled(opacityName) && parent.isControlVisible(opacityName)) {
                return parent;
            } else {
                return findOpacityParentBlock(parent);
            }
        }
    }
}

function Controller(common, Geo) {
    'ngInject';
    const self = this;

    self.checkAvailableControls = checkAvailableControls;
    self.checkWMS = checkWMS;
    self.getStylesLength = getStylesLength;
    self.updateStyles = updateStyles;

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
     * @function checkWMS
     * @private
     * @return {Boolean} true if the block is a WMS layer
     */
    function checkWMS() {
        return self.block.layerType === Geo.Layer.Types.OGC_WMS;
    }

    /**
     * @function getStylesLength
     * @private
     * @return {Number} length of all the possible styles for the layer (only for WMS)
     */
    function getStylesLength() {
        return self.block.mainProxyWrapper.layerConfig.layerEntries.map(entry =>
            entry.allStyles).reduce((a,b) =>
                a.concat(b)).length;
    }

    /**
     * Update the current style for each of the layer entries
     * If the current style is available for the entry, set it to that value
     * Otherwise, set the current style to the default style (the first value in allStyles)
     *
     * @function updateStyles
     * @private
     */
    function updateStyles() {
        const config = self.block.mainProxyWrapper.layerConfig;
        const currentStyle = config.currentStyle;

        config.layerEntries.forEach(entry => {
            if (entry.allStyles.indexOf(currentStyle) !== -1) {
                entry.currentStyle = currentStyle;
            } else {
                entry.currentStyle = entry.allStyles[0];
            }
        });
    }
}
