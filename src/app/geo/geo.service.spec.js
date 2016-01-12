/* global bard, geoService */

describe('geo', () => {

    beforeEach(() => {

        bard.appModule('app.geo');

        // inject services
        //whut does this do?  do i needs it?
        bard.inject('geoService', '$rootScope');

        //stateManager.addState(mockState);

        // a spy can stub any function and tracks calls to it and all arguments. We spy on the service functions to check if they are being called properly. http://jasmine.github.io/2.0/introduction.html#section-Spies
        //spyOn(mapNavigationService, 'zoomIn');
        //spyOn(mapNavigationService, 'zoomOut');
        //spyOn(mapNavigationService, 'zoomTo');
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
