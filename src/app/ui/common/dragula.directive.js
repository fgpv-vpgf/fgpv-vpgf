(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvDragula
     * @module app.ui.common
     * @restrict A
     * @description
     *
     * The `rvDragula` directive is used to workaround angular-dragula propensity of requesting new scopes on the elements.
     * This directive uses inherited scope and the compiles an angular-dragula directive on some random piece of html providing it with proper parameters.
     *
     * `rv-dragula` - [string] name of the dragula bag; mimics the original `dragula` property from the `dragula` directive
     * `rv-dragula-model` - [array] collection to serve as model for dragula reorder; mimics the original `dragula-model` property from the `dragula` directive
     * `rv-dragula-options` - [string] name of the object on the inherited scope (on `self`) providing any overrides for dragule init properies; use this to set up `accept` and other callbacks
     *
     */
    angular
        .module('app.ui.common')
        .directive('rvDragula', rvDragula);

    function rvDragula($compile, dragulaService) {
        const directive = {
            restrict: 'A',
            link: link,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link(scope, el, attr) { // , ctrl) {
            const dragulaScope = scope;

            // set container and the mirror container to be the same element as we need
            const dragulaOptions = {
                containers: [el[0]],
                mirrorContainer: el[0]
            };

            // extend default options with extras from the the parent scope
            angular.extend(dragulaOptions, dragulaScope.self[attr.rvDragulaOptions]);

            dragulaService.options(dragulaScope, attr.rvDragula, dragulaOptions);

            // compile original dragula directive in some html without actually inserting it into the page
            $compile(`<div dragula="'${attr.rvDragula}'" dragula-model="${attr.rvDragulaModel}"></div>`)(
                dragulaScope);
        }
    }
})();
