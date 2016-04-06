(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvTocEntryControl
     * @module ap
     * @restrict E
     * @description
     *
     * The `rvTocEntryControl` directive description.
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
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            // getting toggle object from the layer item controller directly using toggle's name
            self.control = ctrl.entry.options[self.option];
            self.template = tocService.presets.options[self.option];
            self.action = self.action || self.template.action;
        }
    }
})();
