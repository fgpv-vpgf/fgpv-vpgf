(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLayerItem
     * @module app.ui.toc
     * @description
     *
     * The `rvLayerItem` directive is a UI compoenent for a layer in the layer selector (toc).
     *
     * ```html
     * <!-- `layer` attribute binds to the layer item in toc -->
     * <rv-layer-item layer="item"></rv-layer-item>
     * ```
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItem', rvLayerItem);

    function rvLayerItem(tocService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-item.html',
            scope: {
                layer: '='
            },
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        /**
         * Link function binds `toggleGroup` function from the `TocController` to directive's self.
         * @param  {object} scope directive's scope
         */
        function link(scope) {
            const self = scope.self;

            // call toggleGroup function on the tocController with the group object (see template)
            self.toggleLayerFiltersPanel = tocService.actions.toggleLayerFiltersPanel;
        }
    }
})();
