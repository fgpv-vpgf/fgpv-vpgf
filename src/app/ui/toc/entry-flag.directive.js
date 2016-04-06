(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvTocEntryFlag
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvTocEntryFlag` directive is one of the layer flags: type, data, out-of-scale, user-added.
     *
     * ```html
     * <!-- `name` attribute specifies the name of the flag; flag's control object is fetched from the layerItem directive -->
     * <rv-layer-item-flag name="scale"></rv-layer-item-flag>
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
                name: '@'
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

            // getting toggle object from the layer item controller directly using toggle's name
            self.control = ctrl.entry.flags[self.name];
            self.template = tocService.presets.flags[self.name];
        }
    }
})();
