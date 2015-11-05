(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLayerItemFlag
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvLayerItemFlag` directive is one of the layer flags: type, data, out-of-scale, user-added.
     *
     * ```html
     * <!-- `name` attribute specifies the name of the flag; flag's control object is fetched from the layerItem directive -->
     * <rv-layer-item-flag name="scale"></rv-layer-item-flag>
     * ```
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItemFlag', rvLayerItemFlag);

    function rvLayerItemFlag() {
        const directive = {
            require: '^rvLayerItem',
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-item-flag.html',
            scope: {
                name: '@'
            },
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            // getting toggle object from the layer item controller directly using toggle's name
            self.control = ctrl.layer.flags[self.name];
        }
    }
})();
