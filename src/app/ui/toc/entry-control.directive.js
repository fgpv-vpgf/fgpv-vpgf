(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvTocEntryControl
     * @module ap
     * @restrict E
     * @description
     *
     * The `rvTocEntryControl` directive is one of the layer toggle buttons: visiblity, settings, metadata, etc.
     *
     * ```html
     * <!-- `option` attribute specifies the name of the toggle; toggle's control object and its template are fetched from the layerItem directive -->
     * <rv-toc-entry-control option="settings"></toc-entry-control>
     *
     * <!-- `type` attribute specifies the template to be used for the control; it defaults to `entry-button.html`; another option is `entry-control-menu-item.html` -->
     * <rv-toc-entry-control option="metadata" type="menu-item"></rv-toc-entry-control>
     * ```
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvTocEntryControl', rvTocEntryControl);

    function rvTocEntryControl(tocService) {
        const directive = {
            require: '^rvTocEntry',
            restrict: 'E',
            templateUrl: (elm, attr) => {
                // returns a different template based on the value of the type attribute
                const type = attr.type || 'button'; // `type` is a string, so no need to check if it's defined or not
                return `app/ui/toc/templates/entry-control-${type}.html`;
            },
            scope: {
                action: '&?', // overloading default template action
                // entry: '=',
                option: '@'
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

        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            // getting toggle object from the layer item controller directly using toggle's name
            self.entry = ctrl.entry;
            self.control = ctrl.entry.options[self.option];

            // if the control is undefined, selfdestruct
            if (typeof self.control === 'undefined') {
                el.remove();
                scope.$destroy();
                return;
            }

            self.template = tocService.presets.options[self.option];
            self.action = self.action || self.template.action;
            self.isFunction = angular.isFunction;
        }
    }
})();
