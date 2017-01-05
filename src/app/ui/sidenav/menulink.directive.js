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
        .module('app.ui')
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
                control: '='
            },
            controller: angular.noop,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }
})();
