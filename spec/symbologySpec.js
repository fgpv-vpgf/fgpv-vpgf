/* jshint jasmine: true */
'use strict';
const symbologyModule = require('../src/symbology.js');

describe('Symbology', () => {
    const fakeBundle = {
        esriRequest: (x) => {
            x.layers = [
                {
                    layerId: 1,
                    legend: [
                        {
                            label: 'label1',
                            imageData: 'imgData1',
                            contentType: 'type1'
                        }
                    ]
                },
                {
                    layerId: 2,
                    legend: [
                        {
                            label: 'label2',
                            imageData: 'imgData2',
                            contentType: 'type2'
                        }
                    ]
                }
            ];
            return Promise.resolve(x);
        }
    };
    const fakeGapi = {
        symbology: {
            rendererToLegend: (x) => { return x; },
        }
    };
    let symbology;
    beforeEach(() => {
        symbology = symbologyModule(fakeBundle, fakeGapi);
    });

    describe('enhanceRenderer', () => {
        let renderer;
        let legend;
        beforeEach(() => {
            renderer = { };
            legend = {
                layers: [
                    {
                        legend: [ ]
                    }
                ]
            };
        });

        it('should work for a SimpleRenderer', (done) => {
            renderer.type = 'simple';
            renderer.label = 'la';
            legend.layers[0].legend.push(
                Promise.resolve({
                    label: 'la',
                    svgcode: '1'
                })
            );
            expect(renderer.svgcode).toBeUndefined();
            const res = symbology.enhanceRenderer(renderer, legend);
            res.then(x => {
                expect(renderer.svgcode).toEqual('1');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for a UniqueValueRenderer', (done) => {
            renderer.type = 'uniqueValue';
            renderer.defaultLabel = 'def';
            renderer.uniqueValueInfos = [
                { label: 'uvi1' },
                { label: 'uvi2' }
            ];
            legend.layers[0].legend.push(
                Promise.resolve({
                    label: 'def',
                    svgcode: '1'
                }),
                Promise.resolve({
                    label: 'uvi1',
                    svgcode: '1a'
                }),
                Promise.resolve({
                    label: 'uvi2',
                    svgcode: '1b'
                }));
            expect(renderer.defaultsvgcode).toBeUndefined();
            const res = symbology.enhanceRenderer(renderer, legend);
            res.then(x => {
                expect(renderer.defaultsvgcode).toEqual('1');
                expect(renderer.uniqueValueInfos[0].svgcode).toEqual('1a');
                expect(renderer.uniqueValueInfos[1].svgcode).toEqual('1b');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for a ClassBreaksRenderer', (done) => {
            renderer.type = 'classBreaks';
            renderer.defaultLabel = 'cla';
            renderer.classBreakInfos = [
                { label: 'cbi1' },
                { label: 'cbi2' }
            ];
            legend.layers[0].legend.push(
                Promise.resolve({
                    label: 'cla',
                    svgcode: '1'
                }),
                Promise.resolve({
                    label: 'cbi1',
                    svgcode: '1a'
                }),
                Promise.resolve({
                    label: 'cbi2',
                    svgcode: '1b'
                }));
            expect(renderer.defaultsvgcode).toBeUndefined();
            const res = symbology.enhanceRenderer(renderer, legend);
            res.then(x => {
                expect(renderer.defaultsvgcode).toEqual('1');
                expect(renderer.classBreakInfos[0].svgcode).toEqual('1a');
                expect(renderer.classBreakInfos[1].svgcode).toEqual('1b');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for an unsupported renderer type', (done) => {
            renderer.type = 'unsupportedExample';
            renderer.label = 'la';
            legend.layers[0].legend.push(
                Promise.resolve({
                    label: 'la',
                    svgcode: '1'
                })
            );
            expect(renderer.svgcode).toBeUndefined();
            const res = symbology.enhanceRenderer(renderer, legend);
            res.then(x => {
                expect(renderer.svgcode).toBeUndefined();
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

    describe('getGraphicIcon and getGraphicSymbol', () => {
        let renderer = { };
        let attributes = { };

        describe('Renderer Type: SimpleRenderer', () => {
            beforeEach(() => {
                renderer.type = 'simple';
                renderer.svgcode = '1';
                renderer.symbol = {
                    color: 'white',
                    type: 'simplelinesymbol'
                };
            });

            describe('getGraphicIcon', () => {
                it('should work for a SimpleRenderer', () => {
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('1');
                });

            });

            describe('getGraphicSymbol', () => {
                it('should work for a SimpleRenderer', () => {
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('white');
                    expect(res.type).toEqual('simplelinesymbol');
                });

            });

        });

        describe('Renderer Type: UniqueValueRenderer', () => {
            beforeEach(() => {
                renderer.type = 'uniqueValue';
                renderer.defaultsvgcode = '1';
                renderer.defaultSymbol = {
                    color: 'white',
                    type: 'simplelinesymbol'
                };
                renderer.field1 = 'f1';
                renderer.field2 = '';
                renderer.field3 = '';
                renderer.uniqueValueInfos = [
                    {
                        value: '',
                        svgcode: '123',
                        symbol: {
                            color: 'uviwhite',
                            type: 'uvisimplefillsymbol'
                        }
                    }
                ];
                attributes = {
                    f1: 'att',
                    f2: 'att2',
                    f3: 'att3'
                };
            });

            describe('getGraphicIcon', () => {
                it('should work for a UniqueValueRenderer with no field2', () => {
                    renderer.uniqueValueInfos[0].value = 'att';
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('123');
                });

                it('should work for a UniqueValueRenderer with a field2 and field3', () => {
                    renderer.field2 = 'f2';
                    renderer.field3 = 'f3';
                    renderer.uniqueValueInfos[0].value = 'att, att2, att3';
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('123');
                });

                it('should work for a UniqueValueRenderer with no matching entry for value maps', () => {
                    renderer.uniqueValueInfos[0].value = 'att2';
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('1');
                });

            });

            describe('getGraphicSymbol', () => {
                it('should work for a UniqueValueRenderer with no field2', () => {
                    renderer.uniqueValueInfos[0].value = 'att';
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('uviwhite');
                    expect(res.type).toEqual('uvisimplefillsymbol');
                });

                it('should work for a UniqueValueRenderer with a field2 and field3', () => {
                    renderer.field2 = 'f2';
                    renderer.field3 = 'f3';
                    renderer.uniqueValueInfos[0].value = 'att, att2, att3';
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('uviwhite');
                    expect(res.type).toEqual('uvisimplefillsymbol');
                });

                it('should work for a UniqueValueRenderer with no matching entry for value maps', () => {
                    renderer.uniqueValueInfos[0].value = 'att2';
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('white');
                    expect(res.type).toEqual('simplelinesymbol');
                });

            });

        });

        describe('Renderer Type: ClassBreaksRenderer', () => {
            beforeEach(() => {
                renderer.type = 'classBreaks';
                renderer.minValue = 2;
                renderer.defaultsvgcode = 'def1';
                renderer.defaultSymbol = {
                    color: 'defwhite',
                    type: 'simplefillsymbol'
                };
                renderer.classBreakInfos = [
                    {
                        classMaxValue: 5,
                        svgcode: 'cbi1',
                        symbol: {
                            color: 'cbi1white',
                            type: 'cbi1simpleline'
                        }
                    },
                    {
                        classMaxValue: 1,
                        svgcode: 'cbi2',
                        symbol: {
                            color: 'cbi2black',
                            type: 'cbi2simplemarker'
                        }
                    }
                ];
                renderer.field = 'fi';
            });

            describe('getGraphicIcon', () => {
                it('should work for a ClassBreaksRenderer out of range on low end', () => {
                    attributes.fi = 1;
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('def1');
                });

                it('should work for a ClassBreaksRenderer out of range on high end', () => {
                    attributes.fi = 6;
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('def1');
                });

                it('should work for a ClassBreaksRenderer in range on both ends', () => {
                    attributes.fi = 2;
                    const res = symbology.getGraphicIcon(attributes, renderer);
                    expect(res).toEqual('cbi1');
                });

            });

            describe('getGraphicSymbol', () => {
                it('should work for a ClassBreaksRenderer out of range on low end', () => {
                    attributes.fi = 1;
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('defwhite');
                    expect(res.type).toEqual('simplefillsymbol');
                });

                it('should work for a ClassBreaksRenderer out of range on high end', () => {
                    attributes.fi = 6;
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('defwhite');
                    expect(res.type).toEqual('simplefillsymbol');
                });

                it('should work for a ClassBreaksRenderer in range on both ends', () => {
                    attributes.fi = 2;
                    const res = symbology.getGraphicSymbol(attributes, renderer);
                    expect(res.color).toEqual('cbi1white');
                    expect(res.type).toEqual('cbi1simpleline');
                });

            });

        });

    });

    describe('mapServerToLocalLegend', () => {
        const fakeURL = 'http://maps-cartes.ec.gc.ca/arcgis/rest/services/Common/CommonGIS_AuxMerc/MapServer/';
        
        it('should work for a mapServerURL and layerIndex provided', (done) => {
            const res = symbology.mapServerToLocalLegend(fakeURL, 1);
            res.then(x => {
                expect(x.uniqueValueInfos[0].label).toEqual('label1');
                expect(x.uniqueValueInfos[0].symbol.imageData).toEqual('imgData1');
                expect(x.uniqueValueInfos[0].symbol.contentType).toEqual('type1');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for a mapServerURL with no layerIndex provided', (done) => {
            const res = symbology.mapServerToLocalLegend(fakeURL);
            res.then(x => {
                expect(x.uniqueValueInfos[0].label).toEqual('label1');
                expect(x.uniqueValueInfos[0].symbol.imageData).toEqual('imgData1');
                expect(x.uniqueValueInfos[0].symbol.contentType).toEqual('type1');
                expect(x.uniqueValueInfos[1].label).toEqual('label2');
                expect(x.uniqueValueInfos[1].symbol.imageData).toEqual('imgData2');
                expect(x.uniqueValueInfos[1].symbol.contentType).toEqual('type2');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

});