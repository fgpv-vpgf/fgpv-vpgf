/* jshint jasmine: true */
'use strict';
const attribFCModule = require('../src/layer/layerRec/attribFC.js')();

describe('AttribFC', () => {
    const parent = {
        _apiRef: {
            symbology: {
                generatePlaceholderSymbology: () => { return; },
                getGraphicIcon: () => { return 'fakeSymbol'; },
                mapServerToLocalLegend: () => {
                    const x = {
                        layers: [
                            {
                                legend: [
                                    Promise.resolve({
                                        label: 'label',
                                        svgcode: '123'
                                    })
                                ]
                            }
                        ]
                    };
                    return Promise.resolve(x);
                }
            }
        },
        _layer: { },
        _esriRequest: () => {
            const x = {
                feature: {
                    attributes: {
                        OBJECTID: 1,
                        NAME: 'fakeName',
                        LAT: 28,
                        LONG: 94
                    },
                    geometry: {
                        paths: [[
                            [-94.7999999999999, 28.0000000000001],
                            [-95.3999999999999, 28.0000000000001]
                        ]]
                    }
                }
            };
            return Promise.resolve(x);
        }
    };
    const layerPackage = {
        getAttribs: () => {
            const x = {
                features: [
                    {
                        attributes: {
                            a: '',
                            b: ''
                        }
                    }
                ],
                oidIndex: 'index'
            };
            return Promise.resolve(x);
        }
    };
    const config = {
        state: { }
    };
    let attribFC;
    beforeEach(() => {
        attribFC = new attribFCModule.AttribFC(parent, '1', layerPackage, config);
    });

    describe('loadSymbology', () => {
        it('should work for a feature layer', (done) => {
            layerPackage.layerData = Promise.resolve({
                layerType: 'Feature Layer',
                legend: {
                    layers: [
                        {
                            legend: [
                                Promise.resolve({
                                    label: 'la',
                                    svgcode: '1'
                                })
                            ]
                        }
                    ]
                }
            });
            const res = attribFC.loadSymbology();
            res.then(() => {
                expect(attribFC.symbology[0].svgcode).toEqual('1');
                expect(attribFC.symbology[0].name).toEqual('la');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work for a non-feature layer if URL is defined', (done) => {
            parent._layer.url = 'fakeURL';
            layerPackage.layerData = Promise.resolve({
                layerType: 'Non-Feature Layer',
                legend: { }
            });
            const res = attribFC.loadSymbology();
            res.then(() => {
                expect(attribFC.symbology[0].svgcode).toEqual('123');
                expect(attribFC.symbology[0].name).toEqual('label');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

    describe('getFeatureName', () => {
        it('should extract name if nameField and attribs are defined', () => {
            attribFC.nameField = 'nf';
            const attribs = {
                nf: 'fakeName'
            };
            const res = attribFC.getFeatureName('1', attribs);
            expect(res).toEqual('fakeName');
        });

        it('should use objId if nameField or attribs are not defined', () => {
            const res = attribFC.getFeatureName('0', null);
            expect(res).toEqual('Feature 0');
        });

    });

    describe('getFormattedAttributes', () => {
        beforeEach(() => {
            spyOn(attribFC, 'getAttribs').and.callThrough();
            spyOn(attribFC, 'getLayerData').and.callThrough();
        });

        it('should work if formattedAttributes field is already defined', (done) => {
            attribFC._formattedAttributes = Promise.resolve({
                columns: [{ }],
                rows: [{ }],
                fields: [{ }],
                oidField: 'oid',
                oidIndex: 'idx',
                renderer: 'renderer'
            });
            const res = attribFC.getFormattedAttributes();
            res.then(x => {
                expect(x.oidField).toEqual('oid');
                expect(x.oidIndex).toEqual('idx');
                expect(x.renderer).toEqual('renderer');
                expect(attribFC.getAttribs).not.toHaveBeenCalled();
                expect(attribFC.getLayerData).not.toHaveBeenCalled();
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should work if data was correctly loaded', (done) => {
            layerPackage.layerData = Promise.resolve({
                fields: [
                    { name: 'a', alias: 'alias' },
                    { name: 'b' },
                    { name: 'c' }
                ],
                oidField: 'fakeOid',
                renderer: 'fakeRenderer'
            });
            const res = attribFC.getFormattedAttributes();
            res.then(x => {
                expect(attribFC.getAttribs).toHaveBeenCalled();
                expect(attribFC.getLayerData).toHaveBeenCalled();
                expect(x.oidField).toEqual('fakeOid');
                expect(x.oidIndex).toEqual('index');
                expect(x.columns[0]).toEqual({ data: 'a', title: 'alias' });
                expect(x.columns[1]).toEqual({ data: 'b', title: 'b' });
                expect(x.rows[0]).toEqual({ a: '', b: '', rvInteractive: '', rvSymbol: 'fakeSymbol' });
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

    describe('checkDateType', () => {
        it('should return false if no fields attribute', (done) => {
            layerPackage.layerData = Promise.resolve({
                layerType: 'Non-Feature Layer',
                legend: { }
            });
            const res = attribFC.checkDateType('fakeName');
            res.then(x => {
                expect(x).toBeFalsy();
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should return false if attribute is not an esriFieldTypeDate type', (done) => {
            layerPackage.layerData = Promise.resolve({
                fields: [
                    { name: 'fakeName', type: 'notTypeDate' },
                    { name: 'a', type: 'esriFieldTypeDate' }
                ]
            });
            const res = attribFC.checkDateType('fakeName');
            res.then(x => {
                expect(x).toBeFalsy();
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should return true if attribute is an esriFieldTypeDate type', (done) => {
            layerPackage.layerData = Promise.resolve({
                fields: [
                    { name: 'a', type: 'randomType' },
                    { name: 'fakeName', type: 'esriFieldTypeDate' }
                ]
            });
            const res = attribFC.checkDateType('fakeName');
            res.then(x => {
                expect(x).toBeTruthy();
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

    describe('aliasedFieldName', () => {
        it('should return the system attribute name if alias is not defined', (done) => {
            layerPackage.layerData = Promise.resolve({
                fields: [ ]
            });
            const res = attribFC.aliasedFieldName('attribute');
            res.then(x => {
                expect(x).toEqual('attribute');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

        it('should return the alias if defined', (done) => {
            layerPackage.layerData = Promise.resolve({
                fields: [
                    { name: 'attribute', alias: 'attrAlias' },
                    { name: 'fakeName', type: 'esriFieldTypeDate' }
                ]
            });
            const res = attribFC.aliasedFieldName('attribute');
            res.then(x => {
                expect(x).toEqual('attrAlias');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

    describe('unAliasAttribs', () => {
        it('should work if there are no attribute with field name', () => {
            const attribs = {
                aA: 'aliasA',
                aB: 'aliasB'
            };
            const fields = [
                { name: 'nA', alias: 'aA' },
                { name: 'nB', alias: 'aB' }
            ];
            const res = attribFC.constructor.unAliasAttribs(attribs, fields);
            expect(res.nA).toEqual('aliasA');
            expect(res.nB).toEqual('aliasB');
        });

        it('should work if every attribute has a field name', () => {
            const attribs = {
                nA: 'nameA',
                nB: 'nameB'
            };
            const fields = [
                { name: 'nA', alias: 'aA' },
                { name: 'nB', alias: 'aB' }
            ];
            const res = attribFC.constructor.unAliasAttribs(attribs, fields);
            expect(res.nA).toEqual('nameA');
            expect(res.nB).toEqual('nameB');
        });

    });

    describe('fetchGraphic', () => {
        it('should return a prommise containing graphic', (done) => {
            const res = attribFC.fetchGraphic(1, {});
            res.then(x => {
                expect(x).not.toEqual(undefined);
                expect(x.graphic).not.toEqual(undefined);
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

});
