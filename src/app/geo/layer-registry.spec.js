/* global bard, layerRegistry, $q */

describe('layerRegistry', () => {

    // fake gapi service
    function mockGapiService($provide) {
        $provide.factory('gapiService', () => {
            return {};
        });
    }

    beforeEach(() => {

        bard.appModule('app.geo', mockGapiService);

        // inject services
        bard.inject('layerRegistry', '$q');
    });

    describe('layerRegistry', () => {

        // check registering a layer
        it('should register a layer', () => {
            let tempLayer = {
                id: 'sausages',
                setVisibility: () => {}
            };
            let tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            layerRegistry.registerLayer(tempLayer, tempConfig, {});

            // layer is now in registry
            expect(layerRegistry.layers.sausages)
                .toBeDefined();
            expect(layerRegistry.layers.sausages.layer)
                .toBeDefined();
            expect(layerRegistry.layers.sausages.layer.id)
                .toBe('sausages');
            expect(layerRegistry.layers.sausages.state)
                .toBeDefined();
            expect(layerRegistry.layers.sausages.attribs)
                .toBeDefined();
            expect(layerRegistry.layers.sausages.state.url)
                .toBe('http://www.sausagelayer.com/');
            expect(layerRegistry.legend)
                .toContain('sausages');

            expect(layerRegistry.layers.sausages.state.options)
                .toBeDefined();
            expect(layerRegistry.layers.sausages.state.options.visibility.value)
                .toBe('on');
        });

        it('should bundle attributes correctly', () => {
            let tempLayer = {
                id: 'sausages',
                setVisibility: () => {}
            };
            let tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            let tempAttribPromise = $q.resolve({
                layerId: 'sausages',
                0: {
                    features: [{
                        attributes: {
                            abc: '123'
                        }
                    }]
                }
            });

            layerRegistry.registerLayer(tempLayer, tempConfig, tempAttribPromise);

            layerRegistry.getFormattedAttributes(tempLayer.id, '0')
                .then(bundledAttributes => {
                    expect(bundledAttributes.data)
                        .toBeDefined();
                    expect(bundledAttributes.columns)
                        .toBeDefined();
                });
        });

    });
});
