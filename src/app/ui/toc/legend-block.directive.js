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

function rvLegendBlock($compile, $templateCache, layoutService, appInfo, common) {
    const directive = {
        restrict: 'E',
        scope: {
            block: '=',
            isInSet: '=',
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

        // a shorthand for less verbocity

        // store reference to element on the scope so it can be passed to symbology stack as container
        self.element = element;

        self.intersect = common.intersect;
        self.getTooltipDirection = getTooltipDirection;
        self.getTooltipDelay = getTooltipDelay;

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
    }
}
