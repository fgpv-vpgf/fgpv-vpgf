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

    function rvLayerItem() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-item.html',
            scope: {
                layer: '='
            },
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }
})();
