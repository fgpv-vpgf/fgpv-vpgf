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
            // let drake;

            dragulaService.options(dragulaScope, attr.rvDragula, {
                containers: [el[0]],
                mirrorContainer: el[0]
            });

            // drake = dragulaService.find(dragulaScope, 'toc-bag');

            $compile(`<div dragula="'${attr.rvDragula}'" dragula-model="${attr.rvDragulaModel}"></div>`)(dragulaScope);
        }
    }
})();
