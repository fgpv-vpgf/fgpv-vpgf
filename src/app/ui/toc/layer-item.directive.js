(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLayerItem
     * @module app.ui.toc
     * @description
     *
     * The `rvLayerItem` directive is a UI compoenent for a layer in the layer selector (toc).
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItem', rvLayerItem);

    function rvLayerItem() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-item.html',
            scope: {
                layer: '='
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
        function linkFunc() { //scope, el, attr, ctrl) {

        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {
        //const self = this;

        activate();

        function activate() {

        }
    }
})();
