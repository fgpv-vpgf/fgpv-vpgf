(() => {
    'use strict';

    /**
     * @module rvTocEntryControl
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvTocEntryControl` directive is one of the layer toggle buttons: visiblity, settings, metadata, etc.
     *
     * ```html
     * <!-- `option` attribute specifies the name of the toggle; toggle's control object and its template are fetched from the layerItem directive -->
     * <rv-toc-entry-control option="settings"></toc-entry-control>
     *
     * <!-- `template` attribute specifies the template to be used for the control; it defaults to `entry-button.html`; another option is `entry-control-menu-item.html` -->
     * <rv-toc-entry-control option="metadata" template="menu-item"></rv-toc-entry-control>
     * ```
     *
     * If the `persist` attribute is set, the directive will be displayed empty if the corresponding control object is undefined.
     *
     */
    angular
        .module('app.ui')
        .directive('rvLegendControl', rvLegendControl);

    function rvLegendControl(LegendElementFactory) {
        const directive = {
            restrict: 'E',
            templateUrl: (elm, attr) => {
                // returns a different template based on the value of the template attribute
                // button, toggle
                const template = attr.template || 'button'; // `template` is a string, so no need to check if it's defined or not
                console.log(template);
                // return `app/ui/toc/templates/entry-control-${template}.html`;
                return `app/ui/toc/templates/legend-control-${template}.html`;
            },
            scope: {
                block: '=',
                name: '@'
            },
            link: {
                pre: link
            },
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link(scope, el, attr) {
            const self = scope.self;

            self.uiControl = LegendElementFactory.makeControl(self.block, self.name);

            self.Math = window.Math;

            // if the control is undefined, selfdestruct
            if (!self.uiControl.isVisible && attr.persist !== 'true') {
                el.remove();
                scope.$destroy();
            }
        }
    }
})();
