/* global bard, geoService */

describe('geo', () => {

    beforeEach(() => {

        bard.appModule('app.geo');

        // inject services
        bard.inject('geoService');
    });

    xdescribe('geoService', () => {

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

        it('should set zoom correctly', () => {
            // make a fake map object
            let map = {
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

        //TODO add test: register layer with no id
        //TODO add test: register attributes with no layerId
        //TODO add test: register layer with id that is already registered
        //TODO add test: register layer without a config param
        //TODO add test: register attributes for a layer that has not been registered
        //TODO add test: optional attribute registration during registerLayer call
        //TODO add test: optional order parameter during registerLayer call
    });
});
