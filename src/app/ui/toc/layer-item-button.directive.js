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
     *
     * <!-- `type` attribute specifies the template to be used for the control; it defaults to `layer-item-button.html`; another option is `layer-item-menu-item.html` -->
     * <rv-layer-item-button name="metadata" type="menu-item"></rv-layer-item-button>
     * ```
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItemButton', rvLayerItemButton);

    function rvLayerItemButton(tocService) {
        const directive = {
            require: '^rvLayerItem',
            restrict: 'E',
            templateUrl: (elm, attr) => {
                // returns a different template based on the value of the type attribute
                const type = attr.type || 'button'; // `type` is a string, so no need to check if it's defined or not
                return `app/ui/toc/layer-item-${type}.html`;
            },
            scope: {
                action: '&?', // overloading default template action
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
            self.control = ctrl.layer.options[self.name];
            self.template = tocService.presets.options[self.name];
            self.action = self.action || self.template.action;
        }
    }
})();
