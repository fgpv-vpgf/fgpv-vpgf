/* global bard, layerRegistry, $q */

xdescribe('layerRegistry', () => {

    // make a fake map object
    const geoState = {
        mapService: {
            mapObject: {
                addLayer: angular.noop,
                removeLayer: angular.noop,
                getScale: () => 0
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
            return {
                gapi: {
                    events: {
                        wrapEvents: angular.noop
                    }
                }
            };
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

    // check registering a layer
    it('should register a layer', () => {
        const tempLayer = {
            id: 'sausages',
            setVisibility: () => {},
            setOpacity: () => {}
        };
        const tempConfig = {
            url: 'http://www.sausagelayer.com/2', // <- feature layer has index
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
        expect(lr.layers.sausages.state.url)
            .toBe('http://www.sausagelayer.com');
        expect(lr.layers.sausages.state.featureIdx)
            .toBe('2');

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

    it('should find the correct position to insert layers', () => {
        const gstate = Object.create(geoState);
        gstate.mapService.mapObject.graphicLayerIds = ['1', '0'];
        const lr = layerRegistry(geoState, currentConfig);
        const ltypes = ['ogcWms', 'esriTile', 'esriFeature'];
        lr.legend.items = ltypes.map((ltype, idx) => ({ layer: { id: String(idx), layerType: ltype } }));
        const result = lr.getLayerIndexAbove(1);
        expect(result).toBe(2);
    });

    it('should find the correct position to insert layers when failed layers are present', () => {
        const gstate = Object.create(geoState);
        gstate.mapService.mapObject.graphicLayerIds = ['2', '0'];
        const lr = layerRegistry(geoState, currentConfig);
        const ltypes = ['ogcWms', 'esriTile', 'ogcWms', 'esriTile', 'esriFeature'];
        lr.legend.items = ltypes.map((ltype, idx) => ({ layer: { id: String(idx), layerType: ltype } }));
        const result = lr.getLayerIndexAbove(1);
        expect(result).toBe(0);
    });

    it('should correctly compare with feature layers when a feature layer is selected', () => {
        const gstate = Object.create(geoState);
        gstate.mapService.mapObject.layerIds = ['a', '4', 'b', 'c'];
        const lr = layerRegistry(geoState, currentConfig);
        const ltypes = ['ogcWms', 'esriTile', 'ogcWms', 'esriTile', 'esriFeature'];
        lr.legend.items = ltypes.map((ltype, idx) => ({ layer: { id: String(idx), layerType: ltype } }));
        const result = lr.getLayerIndexAbove(4);
        expect(result).toBe(4);
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
        const tempAttribPromise = {
            layerId: 'sausages',
            0: {
                getAttribs: () => $q.resolve({
                    features: [{
                        attributes: {
                            abc: '123'
                        }
                    }]
                }),
                layerData: $q.resolve()
            }
        };

        const lr = layerRegistry(geoState, currentConfig);
        lr.registerLayer(tempLayer, tempConfig, tempAttribPromise);

        lr.layers.sausages.getAttributes(0)
            .then(bundledAttributes => {
                expect(bundledAttributes.rows)
                    .toBeDefined();
                expect(bundledAttributes.columns)
                    .toBeDefined();
            });
    });
});
