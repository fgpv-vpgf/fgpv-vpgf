/* jshint jasmine: true */
'use strict';
const wmsFCModule = require('../src/layer/layerRec/wmsFC.js')();

describe('WmsFC', () => {
    let i;
    let parent = {
        _apiRef: {
            layer: {
                ogc: {
                    getLegendUrls: () => {
                        const x = [
                            { svgcode: '123' },
                            { svgcode: '456' },
                            { svgcode: '789' }
                        ];
                        return x;
                    }
                }
            },
            symbology: {
                generateWMSSymbology: (name1, imageUri) => {
                    const fakeData = {
                        name: name1,
                        svgcode: imageUri.svgcode
                    };
                    return Promise.resolve(fakeData);
                },
                generatePlaceholderSymbology: () => { return; }
            }
        }
    };
    const config = {
        name: '',
        state: {
            query: { }
        },
        extent: { }
    };
    let wmsFC;
    beforeEach(() => {
        parent.config = {
            layerEntries: [
                { id: '0', name: '' },
                { id: '1', name: '' },
                { id: '2', name: '' }
            ]
        };
        parent._layer = {
            layerInfos: [
                {
                    name: '',
                    title: '',
                    subLayers: [
                        { name: '', title: '' }
                    ]
                },
                {
                    name: '',
                    title: '',
                    subLayers: [
                        { name: '', title: '' }
                    ]
                },
                {
                    name: '',
                    title: '',
                    subLayers: [
                        { name: '', title: '' }
                    ]
                }
            ]
        };
        parent._visDelay = {
            lastIdx: '2'
        };
        wmsFC = new wmsFCModule.WmsFC(parent, '1', config);
    });

    describe('loadSymbology', () => {
        afterEach((done) => {
            expect(wmsFC.symbology[0].svgcode).toEqual('123');
            expect(wmsFC.symbology[1].svgcode).toEqual('456');
            expect(wmsFC.symbology[2].svgcode).toEqual('789');
            done();
        });

        it('should work for config specified names', (done) => {
            for (i = 0; i < parent.config.layerEntries.length; i++) {
                parent.config.layerEntries[i].name = 'name' + i;
            }
            const res = wmsFC.loadSymbology();
            res.then(() => {
                for (i = 0; i < parent.config.layerEntries.length; i++) {
                    expect(wmsFC.symbology[i].name).toEqual('name' + i);
                }
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for server specified names found in parent', (done) => {
            for (i = 0; i < parent.config.layerEntries.length; i++) {
                parent._layer.layerInfos[i].name = i.toString();
                parent._layer.layerInfos[i].title = 'match' + i;
            }
            const res = wmsFC.loadSymbology();
            res.then(() => {
                for (i = 0; i < parent.config.layerEntries.length; i++) {
                    expect(wmsFC.symbology[i].name).toEqual('match' + i);
                }
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for server specified names found in children', (done) => {
            for (i = 0; i < parent._layer.layerInfos.length; i++) {
                parent._layer.layerInfos[i].subLayers[0].name = i.toString();
                parent._layer.layerInfos[i].subLayers[0].title = 'childMatch' + i;
            }
            const res = wmsFC.loadSymbology();
            res.then(() => {
                for (i = 0; i < parent.config.layerEntries.length; i++) {
                    expect(wmsFC.symbology[i].name).toEqual('childMatch' + i);
                }
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for config id', (done) => {
            const res = wmsFC.loadSymbology();
            res.then(() => {
                for (i = 0; i < parent.config.layerEntries.length; i++) {
                    expect(wmsFC.symbology[i].name).toEqual(i.toString());
                }
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for any combination of name types', (done) => {
            parent.config.layerEntries[0].name = 'configName';
            parent._layer.layerInfos[1].name = '1';
            parent._layer.layerInfos[1].title = 'serverName';
            const res = wmsFC.loadSymbology();
            res.then(() => {
                expect(wmsFC.symbology[0].name).toEqual('configName');
                expect(wmsFC.symbology[1].name).toEqual('serverName');
                expect(wmsFC.symbology[2].name).toEqual('2');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

});
