(() => {
    'use strict';

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

    function rvLegendBlock(tocService, $compile, $templateCache, appInfo, common) {
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

            scope.$watch('self.block.template', newTemplate => {
                if (newTemplate) {
                    const template = $templateCache.get(`app/ui/toc/templates/legend-${newTemplate}.html`);
                    element.empty().append($compile(template)(scope));

                    console.log(self.block.id, newTemplate);
                }
            });
        }
    }
})();
