(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLayerGroupToggleButton
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvLayerGroupToggleButton` directive is one of the layer group toggle buttons: visiblity, etc. So far we had a need for only group visibility toggle, but this can be used for more if needed.
     *
     * ```html
     * <!-- `name` attribute specifies the name of the toggle; toggle's control object and its template are fetched from the layerGroupToggle directive -->
     * <rv-layer-group-toggle-button name="visibility"></rv-layer-group-toggle-button>
     * ```
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerGroupToggleButton', rvLayerGroupToggleButton);

    function rvLayerGroupToggleButton(tocService) {
        const directive = {
            require: '^rvLayerGroupToggle',
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-group-toggle-button.html',
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
            self.group = ctrl.group;
            self.control = ctrl.group.options[self.name];
            self.template = tocService.presets.groupOptions[self.name];
            self.action = self.action || self.template.action;
        }
    }
})();
