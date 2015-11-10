(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLayerItemButton
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvLayerItemButton` directive is one of the layer toggle buttons: visiblity, settings, metadata, etc.
     *
     * ```html
     * <!-- `name` attribute specifies the name of the toggle; toggle's control object and its template are fetched from the layerItem directive -->
     * <rv-layer-item-button name="settings"></rv-layer-item-button>
     * ```
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItemButton', rvLayerItemButton);

    function rvLayerItemButton(tocService) {
        const directive = {
            require: '^rvLayerItem',
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-item-button.html',
            scope: {
                action: '&?',
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
            self.layer = ctrl.layer;
            self.control = ctrl.layer.toggles[self.name];

            // getting toggle's default action from the tocService using it's name
            self.action = self.action || tocService.presets.toggles[self.name].action;
        }
    }
})();
