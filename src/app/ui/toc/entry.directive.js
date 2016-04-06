(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvTocEntry
     * @module app.ui.toc
     * @restrict EA
     * @description
     *
     * The `rvTocEntry` directive description.
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
                type: '=?'
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
