/* global bard, layerRegistry, $q, $rootScope*/

describe('layerRegistry', () => {

    // make a fake map object
    const geoState = {
        mapService: {
            mapObject: {
                addLayer: () => {}
            }
        }
    };

    // fake gapi service
    function mockGapiService($provide) {
        $provide.factory('gapiService', () => {
            return {};
        });
    }

    // TODO: find a way to share mocked services between tests
    function mockConfigService($provide) {
        $provide.factory('configService', $q => {
            let current = {
                layers: []
            };

            return {
                getCurrent: () => $q.resolve(current),
                setCurrent: config => current = config
            };
        });
    }

    beforeEach(() => {

        bard.appModule('app.geo', mockGapiService, mockConfigService);

        // inject services
        bard.inject('layerRegistry', '$q', '$rootScope');
    });

    describe('layerRegistry', () => {

        // check registering a layer
        it('should register a layer', done => {
            const tempLayer = {
                id: 'sausages',
                setVisibility: () => {}
            };
            const tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            layerRegistry(geoState) // create an instance of layerRegistry
                .then(lr => {
                    lr.registerLayer(tempLayer, tempConfig, {});

                    // layer is now in registry
                    expect(lr.layers.sausages)
                        .toBeDefined();
                    expect(lr.layers.sausages.layer)
                        .toBeDefined();
                    expect(lr.layers.sausages.layer.id)
                        .toBe('sausages');
                    expect(lr.layers.sausages.state)
                        .toBeDefined();
                    expect(lr.layers.sausages.attribs)
                        .toBeDefined();
                    expect(lr.layers.sausages.state.url)
                        .toBe('http://www.sausagelayer.com/');
                    expect(lr.legend)
                        .toContain('sausages');

                    expect(lr.layers.sausages.state.options)
                        .toBeDefined();
                    expect(lr.layers.sausages.state.options.visibility.value)
                        .toBe('on');

                    done();
                });

            $rootScope.$digest();
        });

        it('should bundle attributes correctly', done => {
            const tempLayer = {
                id: 'sausages',
                setVisibility: () => {}
            };
            const tempConfig = {
                url: 'http://www.sausagelayer.com/'
            };
            const tempAttribPromise = $q.resolve({
                layerId: 'sausages',
                0: {
                    features: [{
                        attributes: {
                            abc: '123'
                        }
                    }]
                }
            });

            layerRegistry(geoState) // create an instance of layerRegistry
                .then(lr => {
                    lr.registerLayer(tempLayer, tempConfig, tempAttribPromise);

                    lr.getFormattedAttributes(tempLayer.id, '0')
                        .then(bundledAttributes => {
                            expect(bundledAttributes.data)
                                .toBeDefined();
                            expect(bundledAttributes.columns)
                                .toBeDefined();
                        });

                    done();
                });
            $rootScope.$digest();
        });
    });
});
