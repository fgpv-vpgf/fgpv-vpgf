(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvTocEntry
     * @module app.ui.toc
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

    function rvTocEntry(tocService) {
        const directive = {
            restrict: 'E',
            templateUrl: (elm, attr) => {
                // returns a different template based on the value of the type attribute
                const type = attr.type || 'layer'; // `type` is a string, so no need to check if it's defined or not
                return `app/ui/toc/templates/${type}-entry.html`;
            },
            scope: {
                entry: '=',
                type: '@?'
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
         * @param  {object} scope directive's scope
         */
        function link(scope, element) {
            const self = scope.self;

            // store reference to element on the scope for legend directive to access
            self.element = element;

            if (self.entry.type === 'layer') {
                // call toggleGroup function on the tocController with the group object (see template)
                self.defaultAction = tocService.actions.toggleLayerFiltersPanel;
            } else {
                // call toggleGroup function on the tocController with the group object (see template)
                self.defaultAction = tocService.actions.toggleLayerGroup;
            }
        }
    }
})();
