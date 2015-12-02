(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvLayerGroupToggle
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvLayerGroupToggle` directive is a toggle for a group of layer items.
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerGroupToggle', rvLayerGroupToggle);

    function rvLayerGroupToggle() {
        const directive = {
            restrict: 'E',
            require: '^ngController',
            templateUrl: 'app/ui/toc/layer-group-toggle.html',
            scope: {
                group: '='
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        /**
         * Link function binds `toggleGroup` function from the `TocController` to directive's self.
         * @param  {object} scope directive's scope
         * @param  {object} el    element's node
         * @param  {object} attr  element's attributes
         * @param  {object} ctrl  reference to the `TocController`
         */
        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            // call toggleGroup function on the tocController with the group object (see template)
            self.toggleGroup = ctrl.toggleGroup;
        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {

        //const self = this;

        activate();

        ///////////

        function activate() {

        }
    }
})();
