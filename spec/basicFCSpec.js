/* jshint jasmine: true */
'use strict';
const basicFCModule = require('../src/layer/layerRec/basicFC.js')();

describe('BasicFC', () => {
    const parent = {
        _layer: {
            minScale: 10,
            maxScale: 5
        },
        _apiRef: {
            symbology: {
                generatePlaceholderSymbology: (x) => { return x; },
                mapServerToLocalLegend: () => {
                    const x = {
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
                    };
                    return Promise.resolve(x);
                }
            }
        }
    };
    const config = {
        name: 'cname',
        state: {
            query: {
                returnGeometry: true,
                outFields: ['*'],
                geometry: 'point',
                spatialRelationship: 'intersects'
            }
        },
        extent: {
            xmin: -95,
            ymin: 49,
            xmax: -94.5,
            ymax: 49.5,
            spatialReference: {
                wkid: 4326
            }
        }
    };
    let basicFC;
    beforeEach(() => {
        basicFC = new basicFCModule.BasicFC(parent, '1', config);
    });

    describe('queryable', () => {
        it('should get correctly', () => {
            const res = basicFC.queryable;
            expect(res.returnGeometry).toBeTruthy();
            expect(res.outFields).toEqual(['*']);
            expect(res.geometry).toEqual('point');
            expect(res.spatialRelationship).toEqual('intersects');
        });

        it('should set correctly', () => {
            const fakeQuery = {
                returnGeometry: false,
                outFields: ['DUID'],
                geometry: 'line',
                spatialRelationship: 'union'
            };
            basicFC.queryable = fakeQuery;
            const res = basicFC.queryable;
            expect(res.returnGeometry).not.toBeTruthy();
            expect(res.outFields).toEqual(['DUID']);
            expect(res.geometry).toEqual('line');
            expect(res.spatialRelationship).toEqual('union');
        });

    });

    describe('getScaleSet', () => {
        it('should get the correct minScale and maxScale', () => {
            const res = basicFC.getScaleSet();
            expect(res.minScale).toEqual(10);
            expect(res.maxScale).toEqual(5);
        });

    });

    describe('isOffScale', () => {
        it('should work if out of scale for maxScale', () => {
            const res = basicFC.isOffScale(3);
            expect(res.offScale).toBeTruthy();
            expect(res.zoomIn).not.toBeTruthy();
        });

        it('should work if out of scale of minScale', () => {
            const res = basicFC.isOffScale(12);
            expect(res.offScale).toBeTruthy();
            expect(res.zoomIn).toBeTruthy();
        });

        it('should work if not out of scale', () => {
            const res = basicFC.isOffScale(7);
            expect(res.offScale).not.toBeTruthy();
            expect(res.zoomIn).not.toBeTruthy();
        });

    });

    describe('getVisibility', () => {
        it('should get correctly', () => {
            parent._layer.visible = true;
            const res = basicFC.getVisibility();
            expect(res).toBeTruthy();
        });

    });

    describe('loadSymbology', () => {
        it('should throw error if URL is undefined', () => {
            expect(function () { basicFC.loadSymbology(); }).toThrowError();
        });

        it('should work if URL is not undefined', (done) => {
            parent._layer.url = 'fakeURL';
            const res = basicFC.loadSymbology();
            res.then(() => {
                expect(basicFC.symbology[0].svgcode).toEqual('1');
                expect(basicFC.symbology[0].name).toEqual('la');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

});
