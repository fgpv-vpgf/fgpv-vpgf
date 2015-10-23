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
                group: '=',
                toggleGroup: '&'
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link() { //scope, el, attr, ctrl) {

        }
    }

    function Controller() {
        'ngInject';

        //const self = this;

        activate();

        ///////////

        function activate() {

        }
    }
})();
