/* global HolderIpsum */

(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvBasemap
     * @module app.ui.basemap
     * @restrict E
     * @description
     *
     * The `rvBasemap` directive displays a basemap selector. Its template uses a content pane which is loaded into the `other` panel opening on the right side of the screen. Selector groups basemaps by projection.
     *
     */
    angular
        .module('app.ui.basemap')
        .directive('rvBasemap', rvBasemap);

    function rvBasemap() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/basemap/basemap.html',
            scope: {},
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

        // TODO: remove this; revise when config schema is finalized
        // mocking basemap part of the config
        self.projections = [
            {
                wkid: 3978,
                name: 'Lambert',
                items: [
        'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT3978/MapServer',
        'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/Simple/MapServer',
        'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer',
        'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer'
                ]
            },
            {
                wkid: 102100,
                name: 'Mercator',
                items: [
        'http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
        'http://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer',
        'http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer',
        'http://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
        'http://services.arcgisonline.com/arcgis/rest/services/World_Terrain_Base/MapServer'
                ]
            }
        ];

        // TODO: remove this; revise when config schema is finalized
        // mocking basemap part of the config
        self.projections.forEach(projection => {
            projection.items.forEach((basemap, index) => {
                projection.items[index] = {
                    name: HolderIpsum.words(2, true),
                    type: HolderIpsum.words(1, true),
                    id: index,
                    url: basemap,
                    wkid: projection.wkid,
                    selected: false
                };
            });
        });

        // TODO: remove
        self.projections[1].items[0].selected = true;

        activate();

        ///////////

        function activate() {

        }
    }
})();
