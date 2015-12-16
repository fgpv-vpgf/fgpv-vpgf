(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvBasemapItem
     * @module app.ui.basemap
     * @restrict E
     * @description
     *
     * The `rvBasemapItem` directive displays a single basemap option in the basemap selector.
     *
     * ```html
     * <!-- `basemap` is an object containing basemap properties; see config schema -->
     * <rv-basemap-item basemap='basemap'></rv-basemap-item>
     * ```
     *
     */
    angular
        .module('app.ui.basemap')
        .directive('rvBasemapItem', rvBasemapItem);

    function rvBasemapItem() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/basemap/basemap-item.html',
            scope: {
                basemap: '='
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
        //const self = this;

        activate();

        ///////////

        function activate() {

        }
    }
})();
