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
    function rvMenuLink() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/sidenav/menulink.html',
            scope: {
                section: '='
            },
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Skeleton link function.
         */
        function linkFunc() { // scope, el, attr, ctrl) {
            // console.log(scope, el, attr, ctrl);
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
