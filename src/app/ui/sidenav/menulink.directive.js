(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @module rvMenuLink
     * @memberof app.ui
     * @description
     *
     * The `rvMenuLink` directive is a wrapper around a button to provide some extra functionality (highlight currently selected item for example).
     */
    angular
        .module('app.ui.sidenav')
        .directive('rvMenuLink', rvMenuLink);

    /**
     * `rvMenuLink` directive body.
     * @return {object} directive body
     */
    function rvMenuLink(globalRegistry) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/sidenav/menulink.html',
            scope: {
                section: '='
            },
            link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el) {
            const self = scope.self;

            // give MenuItem plugin a reference to the element for event listening
            if (self.section instanceof globalRegistry.Plugin.MenuItem) {
                self.section.bindElement(el);
            }
        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {
        // let self = this;
        // console.log('--', self.section);

        activate();

        /**************/

        function activate() {

        }
    }
})();
