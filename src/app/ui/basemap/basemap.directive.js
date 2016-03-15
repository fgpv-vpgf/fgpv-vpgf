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

        /*********/

        function link() { // scope, el, attr, ctrl) {
        }
    }

    function Controller(configService, geoService) {
        'ngInject';
        const self = this;
        self.select = select;

        // TODO: remove this; revise when config schema is finalized
        // mocking basemap part of the config
        // self.projections = [
        //     {
        //         wkid: 3978,
        //         name: 'Lambert',
        //         items: [
        // 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT3978/MapServer',
        // 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/Simple/MapServer',
        // 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer',
        // 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer'
        //         ]
        //     },
        //     {
        //         wkid: 102100,
        //         name: 'Mercator',
        //         items: [
        // 'http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
        // 'http://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer',
        // 'http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer',
        // 'http://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
        // 'http://services.arcgisonline.com/arcgis/rest/services/World_Terrain_Base/MapServer'
        //         ]
        //     }
        // ];

        // // TODO: remove this; revise when config schema is finalized
        // // mocking basemap part of the config
        // self.projections.forEach(projection => {
        //     projection.items.forEach((basemap, index) => {
        //         projection.items[index] = {
        //             name: HolderIpsum.words(2, true),
        //             type: HolderIpsum.words(1, true),
        //             id: index,
        //             url: basemap,
        //             wkid: projection.wkid,
        //             selected: false
        //         };
        //     });
        // });

        // // TODO: remove
        // self.projections[1].items[0].selected = true;

        // TODO: code needs to be updated when config schema is stable
        // check to see if config service is ready
        // FIXME: clean up vars
        var promise = configService.ready();

        // run after configService is ready
        promise.then(() => {
            // construct self.projectsions using config
            console.log('Generate basemap object for rv-map directive.');

            self.projections = [];

            var wkidArray = [];

            configService.getCurrent().then(config => {
                // FIXME: in case there is no basemaps; fall back to some default one or something
                var basemaps = config.baseMaps || [];

                basemaps.forEach(basemap => {

                    // make new projection if not exists
                    var wkid = basemap.wkid;
                    var idx;

                    if (wkidArray.indexOf(wkid) !== -1) {
                        console.log('in if wkidArray');
                        idx = wkidArray.indexOf(wkid);
                    } else {

                        // TODO: decision needed on how we handle different type of projection,
                        // adding all of them here, or it won't be an issue if we predefine all
                        // in config.
                        self.projections.push({
                            wkid: wkid,
                            name: (wkid === 3978) ? 'Lambert' :
                                (wkid === 102100) ? 'Mercator' : 'Other',
                            items: []
                        });

                        wkidArray.push(wkid);

                        idx = wkidArray.indexOf(wkid);
                    }

                    self.projections[idx].items.push({
                        name: basemap.name,
                        type: basemap.type,
                        id: basemap.id,
                        url: basemap.layers[0].url,
                        wkid: basemap.wkid,
                        selected: false
                    });

                });

                console.log(basemaps);
            });

        });

        activate();

        /*********/

        function activate() {

        }

        /**
         * Set the basemap as selected
         * @param  {object} basemap basemap object
         */
        function select(basemap) {

            // un-select the previous basemap
            self.projections.forEach(projection => {
                projection.items.forEach(item => {
                    item.selected = false;
                });
            });

            // set the current basemap as selected.
            basemap.selected = true;

            if (geoService.baseMapHasSameSP(basemap.id)) {
                console.log('------ yo -------');
            }

            // geoService.baseMapHasSameSP(basemap.id)
            geoService.selectBasemap(basemap.id);

        }
    }
})();
