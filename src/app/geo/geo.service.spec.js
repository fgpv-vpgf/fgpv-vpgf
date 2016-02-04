/* global bard, geoService, $httpBackend */

describe('geo', () => {

    beforeEach((done) => {

        bard.appModule('app.geo');

        // inject services
        bard.inject('geoService', '$httpBackend');
        geoService.promise.then(() => done());
    });

    describe('geoService', () => {

        //check registering a layer
        it('should register a layer', () => {
            let tempLayer = {
                id: 'sausages'
            };
            let tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            geoService.registerLayer(tempLayer, tempConfig);

            //layer is now in registry
            expect(geoService.layers.sausages)
                .toBeDefined();
            expect(geoService.layers.sausages.layer)
                .toBeDefined();
            expect(geoService.layers.sausages.layer.id)
                .toBe('sausages');
            expect(geoService.layers.sausages.state)
                .toBeDefined();
            expect(geoService.layers.sausages.state.url)
                .toBe('http://www.sausagelayer.com/');
            expect(geoService.layerOrder)
                .toContain('sausages');

            expect(geoService.layers.sausages.state.options)
                .toBeDefined();
            expect(geoService.layers.sausages.state.options.visibility.value)
                .toBe('on');
        });

        //check registering a attribute object
        it('should register attributes', () => {
            let tempLayer = {
                id: 'sausages'
            };
            let tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            geoService.registerLayer(tempLayer, tempConfig);

            let tempAttribs = {
                layerId: 'sausages'
            };
            geoService.registerAttributes(tempAttribs);

            //attribute object is attached to correct layer
            expect(geoService.layers.sausages.attribs)
                .toBeDefined();
            expect(geoService.layers.sausages.attribs.layerId)
                .toBe('sausages');
        });

        it('should bundle attributes correctly', () => {
            let tempLayer = {
                id: 'sausages'
            };
            let tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            geoService.registerLayer(tempLayer, tempConfig);

            let tempAttribs = {
                layerId: 'sausages',
                0: {
                    features: [{
                        attributes: {
                            abc: '123'
                        }
                    }]
                }
            };
            geoService.registerAttributes(tempAttribs);

            let bundledAttributes = geoService.getFormattedAttributes(tempLayer.id, '0');
            expect(bundledAttributes.data)
                .toBeDefined();
            expect(bundledAttributes.columns)
                .toBeDefined();
        });

        it('should set zoom correctly', () => {
            // make a fake map object
            const map = {
                setZoom: () => {},
                getZoom: () => 5
            };

            // set a spy on it
            spyOn(map, 'setZoom');

            // fake a map creating function
            geoService.gapi = {
                mapManager: {
                    Map: () => map,
                    setupMap: () => {}
                }
            };

            // create a fake map
            geoService.buildMap({}, {
                layers: [],
                scalebar: {}
            });

            // call setZoom with different arguments

            geoService.setZoom(2);
            expect(map.setZoom)
                .toHaveBeenCalledWith(2);

            geoService.shiftZoom(2);
            expect(map.setZoom)
                .toHaveBeenCalledWith(7);

            geoService.shiftZoom(-2);
            expect(map.setZoom)
                .toHaveBeenCalledWith(3);
        });

        describe('map', () => {
            const emptyConfig = {
                layers: [],
                scalebar: {}
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

            it('should make a map', () => {
                const m = geoService.gapi.mapManager;
                spyOn(m, 'Map')
                    .and.callThrough();
                geoService.buildMap(el[0], emptyConfig);
                expect(m.Map)
                    .toHaveBeenCalled();
            });

            // TODO: mock responses to layer endpoint calls before re-enabling
            xit('should add all the configured layers', () => {
                const l = geoService.gapi.layer;
                spyOn(l, 'FeatureLayer');
                spyOn(l, 'WmsLayer');
                spyOn(l, 'ArcGISDynamicMapServiceLayer');
                geoService.buildMap(el[0], layerConfig);
                expect(l.FeatureLayer)
                    .toHaveBeenCalled();
                expect(l.WmsLayer)
                    .toHaveBeenCalled();
                expect(l.ArcGISDynamicMapServiceLayer)
                    .toHaveBeenCalled();
            });

        });

        describe('epsg lookup', () => {
            it('should fetch an integer code', (done) => {
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
            it('should fetch an EPSG string code', (done) => {
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

        //TODO add test: register layer with no id
        //TODO add test: register attributes with no layerId
        //TODO add test: register layer with id that is already registered
        //TODO add test: register layer without a config param
        //TODO add test: register attributes for a layer that has not been registered
        //TODO add test: optional attribute registration during registerLayer call
        //TODO add test: optional order parameter during registerLayer call
    });
});
