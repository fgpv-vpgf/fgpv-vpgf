/* global bard, geoService */

describe('geo', () => {

    beforeEach(() => {

        bard.appModule('app.geo');

        // inject services
        bard.inject('geoService');
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

        //TODO add test: register layer with no id
        //TODO add test: register attributes with no layerId
        //TODO add test: register layer with id that is already registered
        //TODO add test: register layer without a config param
        //TODO add test: register attributes for a layer that has not been registered
        //TODO add test: optional attribute registration during registerLayer call
        //TODO add test: optional order parameter during registerLayer call
    });
});
