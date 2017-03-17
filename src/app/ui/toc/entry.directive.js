(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @module rvTocEntry
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvTocEntry` directive is a UI component for a layer or a layer group in the layer selector (toc).
     *
     * ```html
     * <!-- `entry` attribute binds to the layer item in toc -->
     * <!-- `type` attribute indicates which template will be used -->
     * <rv-toc-entry entry="item" type="group"></rv-toc-entry>
     * ```
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvTocEntry', rvTocEntry);

    function rvTocEntry($compile, $templateCache, tocService, layoutService, appInfo) {
        const directive = {
            restrict: 'E',
            scope: {
                entry: '=',
                type: '@?',
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

            // get template from cache
            const template = $templateCache.get(`app/ui/toc/templates/${self.entry.type}-entry.html`);
            element.append($compile(template)(scope));

            // store reference to element on the scope for legend directive to access
            self.element = element;

            self.getTooltipDirection = getTooltipDirection;

            if (self.entry.type === 'layer') {
                // call toggleGroup function on the tocController with the group object (see template)
                self.defaultAction = tocService.actions.toggleLayerFiltersPanel;
            } else if (self.entry.type === 'group') {
                // call toggleGroup function on the tocController with the group object (see template)
                self.defaultAction = tocService.actions.toggleLayerGroup;
            }

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
})();
