const templates = {
    group: require('./templates/legend-group.html'),
    info: require('./templates/legend-info.html'),
    error: require('./templates/legend-error.html'),
    flag: require('./templates/legend-flag.html'),
    node: require('./templates/legend-node.html'),
    placeholder: require('./templates/legend-placeholder.html')
};

/**
 * @ngdoc directive
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

        // a shorthand for less verbocity
        // self.layerProxy = self.block.layerProxy;

        // store reference to element on the scope so it can be passed to symbology stack as container
        self.element = element;

        self.intersect = common.intersect;
        self.getTooltipDirection = getTooltipDirection;

        scope.$watch('self.block.template', newTemplate => {
            if (newTemplate) {
                const template = $templateCache.get(templates[newTemplate]);
                element.empty().append($compile(template)(scope));
                console.log(self.block.id, newTemplate);
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
    }
}
