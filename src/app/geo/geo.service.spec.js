/* global bard, geoService, gapiService, $rootScope, configService, $httpBackend */

describe('geo', () => {

    // make a fake map object
    const map = {
        setZoom: () => {},
        getZoom: () => 5,
        extent: {}
    };

    // fake gapi service
    function mockGapiService($provide) {
        $provide.factory('gapiService', () => {
            return {
                gapi: {
                    Map: {
                        Map: () => map,
                        setupMap: () => {}
                    },
                    events: {
                        wrapEvents: () => {}
                    }
                }
            };
        });
    }

    // fake gapi service
    function mockStorageService($provide) {
        $provide.service('storageService', $q => () => $q.resolve());
    }

    function mockTooltipService($provide) {
        $provide.service('tooltipService', $q => () => $q.resolve());
    }

    function mockConfigService($provide) {
        $provide.factory('configService', $q => {
            let current;

            console.log(current);

            return {};
        });
    }

    function mockTranslateService($provide) {
        $provide.service('$translate', $q => () => $q.resolve());
    }

    function mockEvents($provide) {
        $provide.constant('events', $q => () => $q.resolve());
    }

    function mockMdSidenav($provide) {
        $provide.constant('$mdSidenav', $q => () => $q.resolve());
    }

    beforeEach(() => {

        bard.appModule('app.geo', 'app.common.router', mockStorageService, mockGapiService,
            mockConfigService, mockTranslateService, mockEvents, mockMdSidenav, mockTooltipService);

        // inject services
        bard.inject('geoService', 'gapiService', '$rootScope', 'configService',
            '$httpBackend', '$injector');
    });

    describe('geoService', () => {

        // TODO: re-enable the test after unit test code updated
        // temporary disabled for basemap reprojection code
        xit('should set zoom correctly', done => {
            // set a spy on it
            spyOn(map, 'setZoom');

            configService.setCurrent({
                layers: [],
                legend: {
                    type: 'autopopulate'
                },
                map: {
                    extentSets: [{
                        id: '123456789',
                        default: {
                            spatialReference: {
                                wkid: 3978
                            }
                        }
                    }],
                    components: {
                        scaleBar: {}
                    }
                }
            });

            // create a fake map
            geoService.assembleMap({})
                .then(() => {
                    // call setZoom with different arguments

                    console.log('AAAAAAAAAAA');

                    geoService.setZoom(2);
                    expect(map.setZoom)
                        .toHaveBeenCalledWith(2);

                    geoService.shiftZoom(2);
                    expect(map.setZoom)
                        .toHaveBeenCalledWith(7);

                    geoService.shiftZoom(-2);
                    expect(map.setZoom)
                        .toHaveBeenCalledWith(3);

                    done();
                });

            $rootScope.$digest();
        });

        describe('map', () => {
            const emptyConfig = {
                layers: [],
                legend: {
                    type: 'autopopulate'
                },
                map: {
                    extentSets: [{
                        id: '123456789',
                        full: {},
                        default: {}
                    }],
                    components: {
                        scaleBar: {},
                        overviewMap: {}
                    }
                }
            };
            const layerConfig = {
                layers: [
                    {
                        layerType: 'esriFeature'
                    },
                    {
                        layerType: 'esriDynamic'
                    },
                    {
                        layerType: 'ogcWms'
                    }
            ]
            };
            const el = angular.element('<div id="randomMap" />');

            // TODO: re-enable the test after unit test code updated
            // temporary disabled for basemap reprojection code
            xit('should make a map', done => {
                const m = gapiService.gapi.Map;
                spyOn(m, 'Map')
                    .and.callThrough();

                geoService.assembleMap(el[0])
                    .then(() => {
                        console.log('map is done');
                        expect(m.Map)
                            .toHaveBeenCalled();
                        done();
                    });

                $rootScope.$digest();
            });

            // TODO: mock responses to layer endpoint calls before re-enabling
            xit('should add all the configured layers', () => {
                const l = gapiService.gapi.layer;
                spyOn(l, 'FeatureLayer');
                spyOn(l, 'WmsLayer');
                spyOn(l, 'ArcGISDynamicMapServiceLayer');
                geoService.assembleMap(el[0], layerConfig);
                expect(l.FeatureLayer)
                    .toHaveBeenCalled();
                expect(l.WmsLayer)
                    .toHaveBeenCalled();
                expect(l.ArcGISDynamicMapServiceLayer)
                    .toHaveBeenCalled();
            });

        });

        describe('epsg lookup', () => {
            xit('should fetch an integer code', (done) => {
                $httpBackend.expectGET('http://epsg.io/4326.proj4')
                    .respond('+proj=longlat +datum=WGS84 +no_defs');
                geoService.epsgLookup(4326)
                    .then(projText => {
                        expect(projText)
                            .toBe('+proj=longlat +datum=WGS84 +no_defs');
                        done();
                    })
                    .catch(err => {
                        fail(err);
                        done();
                    });
                $httpBackend.flush();
            });

            xit('should fetch an EPSG string code', (done) => {
                /* jscs:disable maximumLineLength */
                $httpBackend.expectGET('http://epsg.io/3979.proj4')
                    .respond(
                        '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
                    );
                /* jscs:enable maximumLineLength */
                geoService.epsgLookup('EPSG:3979')
                    .then(projText => {
                        console.log(projText);
                        done();
                    })
                    .catch(err => {
                        console.log(err);
                        fail();
                    });
                $httpBackend.flush();
            });
        });

        // TODO add test: register layer with no id
        // TODO add test: register attributes with no layerId
        // TODO add test: register layer with id that is already registered
        // TODO add test: register layer without a config param
        // TODO add test: register attributes for a layer that has not been registered
        // TODO add test: optional attribute registration during registerLayer call
        // TODO add test: optional order parameter during registerLayer call
    });
});
