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
        const self = this;
        self.select = select;

        activate();

        ///////////

        function activate() {

        }

        /**
         * Selects a basemap as the active basemap
         */
        function select() {
            // TODO: move this function to basemap service or config;
            // need to deselect currently selected basemap
            self.basemap.selected = !self.basemap.selected;
        }
    }
})();
