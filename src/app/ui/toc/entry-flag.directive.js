(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @module rvTocEntryFlag
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvTocEntryFlag` directive is one of the layer flags: type, data, out-of-scale, user-added.
     *
     * ```html
     * <!-- `name` attribute specifies the name of the flag; flag's control object is fetched from the layerItem directive -->
     * <rv-toc-entry-flag name="scale"></rv-toc-entry-flag>
     * ```
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvTocEntryFlag', rvTocEntryFlag);

    function rvTocEntryFlag(tocService) {
        const directive = {
            require: '^rvTocEntry',
            restrict: 'E',
            templateUrl: 'app/ui/toc/templates/entry-flag.html',
            scope: {
                name: '@',
                data: '=?'
            },
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            self.data = angular.isDefined(self.data) ? self.data : {};

            // getting toggle object from the layer item controller directly using toggle's name
            self.control = ctrl.entry.flags[self.name];
            self.template = tocService.presets.flags[self.name];
            self.isFunction = angular.isFunction;

            // set flags visibility from configuration file if present
            if (typeof ctrl.entry.options[self.name] !== 'undefined') {
                // if the flag is query, the visible value is reverse of option value because flag is shown if layer is exclude from identify.
                // for other flag, it is the value of enabled
                const visible = (self.name === 'query') ?
                    !ctrl.entry.options[self.name].value : ctrl.entry.options[self.name].enabled;
                ctrl.entry.flags[self.name].visible = visible;
            }
        }
    }
})();
