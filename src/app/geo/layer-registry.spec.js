/* global bard, layerRegistry, $q */

describe('layerRegistry', () => {

    // make a fake map object
    const geoState = {
        mapService: {
            mapObject: {
                addLayer: angular.noop,
                removeLayer: angular.noop
            }
        }
    };

    const currentConfig = {
        layers: [],
        legend: {
            type: 'autopopulate'
        }
    };

    // fake gapi service
    function mockGapiService($provide) {
        $provide.factory('gapiService', () => {
            return {};
        });
    }

    function mockTranslateService($provide) {
        $provide.service('$translate', $q => () => $q.resolve());
    }

    beforeEach(() => {

        bard.appModule('app.geo', mockGapiService, mockTranslateService);

        // inject services
        bard.inject('layerRegistry', '$q');
    });

    describe('layerRegistry', () => {

        // check registering a layer
        it('should register a layer', () => {
            const tempLayer = {
                id: 'sausages',
                setVisibility: () => {},
                setOpacity: () => {}
            };
            const tempConfig = {
                url: 'http://www.sausagelayer.com/',
                layerType: 'esriFeature',
                options: {
                    opacity: {
                        value: 0.5
                    },
                    visibility: {
                        value: 'on'
                    }
                }
            };
            const lr = layerRegistry(geoState, currentConfig); // create an instance of layerRegistry

            lr.registerLayer(tempLayer, tempConfig, $q.resolve());

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

            // TODO: fix legend check
            // expect(lr.legend).toContain('sausages');

            expect(lr.layers.sausages.state.options)
                .toBeDefined();
            expect(lr.layers.sausages.state.options.visibility.value)
                .toBe('on');

            // check if the layer is removed correctly ...
            lr.removeLayer('sausages'); // should remove layer

            // from `layers` object ...
            expect(lr.layers.sausages)
                .not.toBeDefined();

            // and from `legend` as well
            // TODO: fix legend check
            // expect(lr.legend.indexOf(tempLayer.id)).toBe(-1);
        });

        it('should bundle attributes correctly', () => {
            const tempLayer = {
                id: 'sausages',
                setVisibility: () => {},
                setOpacity: () => {}
            };
            const tempConfig = {
                url: 'http://www.sausagelayer.com/',
                layerType: 'esriFeature',
                options: {
                    opacity: {
                        value: 0.5
                    },
                    visibility: {
                        value: 'on'
                    }
                }
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

            const lr = layerRegistry(geoState, currentConfig);
            lr.registerLayer(tempLayer, tempConfig, tempAttribPromise);

            lr.getFormattedAttributes(tempLayer.id, '0')
                .then(bundledAttributes => {
                    expect(bundledAttributes.data)
                        .toBeDefined();
                    expect(bundledAttributes.columns)
                        .toBeDefined();
                });
        });
    });
});
