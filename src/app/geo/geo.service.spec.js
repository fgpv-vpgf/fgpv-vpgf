/* global bard, geoService */

describe('geo', () => {

    beforeEach((done) => {

        bard.appModule('app.geo');

        // inject services
        bard.inject('geoService');
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
                features: [{
                    attributes: {
                        abc: '123'
                    }
                }]
            };
            geoService.registerAttributes(tempAttribs);

            let bundledAttributes = geoService.getFormattedAttributes(tempLayer.id);
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
                layers: []
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
            const emptyConfig = { layers: [] };
            const layerConfig = { layers: [
                { layerType:'esriFeature' },
                { layerType:'esriDynamic' },
                { layerType:'ogcWms' }
            ] };
            const el = angular.element('<div id="randomMap" />');

            it('should make a map', () => {
                const m = geoService.gapi.mapManager;
                spyOn(m, 'Map');
                geoService.buildMap(el[0], emptyConfig);
                expect(m.Map).toHaveBeenCalled();
            });

            xit('should add all the configured layers', () => {
                const l = geoService.gapi.layer;
                spyOn(l, 'FeatureLayer');
                spyOn(l, 'WmsLayer');
                spyOn(l, 'ArcGISDynamicMapServiceLayer');
                geoService.buildMap(el[0], layerConfig);
                expect(l.FeatureLayer).toHaveBeenCalled();
                expect(l.WmsLayer).toHaveBeenCalled();
                expect(l.ArcGISDynamicMapServiceLayer).toHaveBeenCalled();
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
