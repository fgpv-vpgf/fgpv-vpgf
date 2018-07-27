const templates = {
    group: require('./templates/legend-group.html'),
    info: require('./templates/legend-info.html'),
    error: require('./templates/legend-error.html'),
    flag: require('./templates/legend-flag.html'),
    node: require('./templates/legend-node.html'),
    placeholder: require('./templates/legend-placeholder.html'),
    'bad-projection': require('./templates/legend-bad-projection.html'),
    collapsed: ''
};

/**
 *
 * @module rvLegendBlock
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvLegendBlock` directive is a UI component for a layer or a layer group in the layer selector (toc).
 *
 * ```html
 * <!-- `entry` attribute binds to the layer item in toc -->
 * <!-- `type` attribute indicates which template will be used -->
 * <rv-toc-entry entry="item" type="group"></rv-toc-entry>
 * ```
 *
 */
angular
    .module('app.ui')
    .directive('rvLegendBlock', rvLegendBlock);

function rvLegendBlock($compile, $templateCache, layoutService, appInfo, common, configService, ConfigObject, Geo, LegendBlock) {
    const directive = {
        restrict: 'E',
        scope: {
            block: '=',
            isReorder: '=' // this is a flag indicating if Toc is in reorder mode; consider creating a `mode` variable in the TocService if a third mode is created (`select` for example)
        },
        link: link,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*********/

    /**
     * Link function binds `toggleGroup` function from the `TocController` to directive's self.
     * @private
     * @function link
     * @param  {object} scope directive's scope
     */
    function link(scope, element) {
        const self = scope.self;

        self.appID = appInfo.id;
        self.isNameTruncated = false;
        self.hasMenu = () => {
            const autoLegendEh  = configService.getSync.map.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE;
            const options       = common.intersect(self.block.availableControls, ['metadata', 'settings', 'data', 'symbology', 'boundary', 'reload', 'remove']);

            if (options.length === 0) {
                return false;
            } else if (autoLegendEh || self.block.userAdded) {
                return true;
            // special case where 'remove' is the only menu option and it is hidden for layers in structured legends that are not user added
            // prevents user from opening an empty menu
            } else if (options.length === 1 && options[0] === 'remove') {
                return false;
            } else {
                return true;
            }
        };

        // a shorthand for less verbocity

        // store reference to element on the scope so it can be passed to symbology stack as container
        self.element = element;

        self.intersect = common.intersect;
        self.getTooltipDirection = getTooltipDirection;
        self.getTooltipDelay = getTooltipDelay;
        self.notifyApiClick = notifyApiClick;

        scope.$watch('self.block.template', newTemplate => {
            if (newTemplate) {
                const template = $templateCache.get(templates[newTemplate]);
                element.empty().append($compile(template)(scope));
            }
        });

        /**
         * Maps tooltip direction on the legend items to the current layout size:
         * - to the right of the legend item in large layouts
         * - above the element on small and medium layouts
         *
         * @function getTooltipDirection
         * @private
         * @return {String} direction of the tooltip; either 'right' or 'top'
         */
        function getTooltipDirection() {
            return layoutService.currentLayout() === layoutService.LAYOUT.LARGE ? 'right' : 'top';
        }

        /**
         * Determines the delay before the legend block's tooltip is shown.
         * This is a workaround to disabling tooltips for untruncated block names as Angular Material doesn't have a simple way of doing this, and writing a decorator is much more work and is probably not worth it.
         * If the name is truncated, use normal delay; if not, use 500 seconds.
         *
         * @function getTooltipDelay
         * @private
         * @return {Number} a delay before the legend block tooltip is shown
         */
        function getTooltipDelay() {
            return self.isNameTruncated ? 750 : 500000;
        }

        /**
         * Triggers the API layer group observable when a layer is clicked on the legend
         *
         * @function notifyApiClick
         * @private
         * @param {LegendBlock} block legend block that was clicked
         */
        function notifyApiClick(block) {
            let layer;
            if (appInfo.mapi && block.blockType === LegendBlock.TYPES.NODE) {  // make sure the item clicked is a node, and not group or other
                if (block.parentLayerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    layer = appInfo.mapi.layers.allLayers.find(l =>
                        l.id === block.layerRecordId &&
                        l.layerIndex === parseInt(block.itemIndex));
                } else {
                    layer = appInfo.mapi.layers.getLayersById(block.layerRecordId)[0];
                }

                if (layer) {
                    appInfo.mapi.layers._click.next(layer);
                }
            }
        }
    }
}
