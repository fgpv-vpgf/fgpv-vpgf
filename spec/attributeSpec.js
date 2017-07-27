/* jshint jasmine: true */
'use strict';
const attributeModule = require('../src/attribute.js');

describe('Attribute', () => {
    const fakeBundle = {
        esriRequest: (x) => {
            x.type = 'Feature Layer';
            x.geometryType = 'esriGeometryPolygon';
            x.minScale = 0;
            x.maxScale = 0;
            x.extent = {
                xmin: -1.5698060093899999E7,
                ymin: 5113378.755999997,
                xmax: -5857565.7676,
                ymax: 1.79468918812E7,
                spatialReference: {
                    wkid: 102100,
                    latestWkid: 3857
                }
            };
            x.drawingInfo = {
                renderer: { }
            };
            x.fields = [
                {
                    name: 'OBJECTID',
                    type: 'esriFieldTypeOID',
                    alias: 'OBJECTID',
                    domain: null
                }
            ];
            return Promise.resolve(x);
        }
    };
    const fakeGapi = {
        symbology: {
            rendererToLegend: () => { return; },
            enhanceRenderer: () => { return; },
            cleanRenderer: () => { return; }
        }
    };
    let attribute;
    beforeEach(() => {
        attribute = attributeModule(fakeBundle, fakeGapi);
    });

    describe('getLayerIndex', () => {
        it('should throw an error given a non-layer URL', () => {
            expect(function () {
                attribute.getLayerIndex('http://maps-cartes.ec.gc.ca/arcgis/rest/services/Common/CommonGIS_AuxMerc/');
            }).toThrowError();
        });

        it('should throw an error given just a number as input', () => {
            expect(function () { attribute.getLayerIndex('1'); }).toThrowError();
        });

        it('should skim the last number off the URL given a valid input', () => {
            expect(attribute.getLayerIndex(
                'http://maps-cartes.ec.gc.ca/arcgis/rest/services/Common/CommonGIS_AuxMerc/MapServer/1')
            ).toEqual(1);
        });

    });

    describe('loadServerAttribs', () => {

        // FIXME need to test it in a different way since the attributes of the renderer fomr the layer was missing

        // it('should work for a Feature Layer requesting all attributes', (done) => {
        //     const mapURL = 'http://maps-cartes.ec.gc.ca/arcgis/rest/services/Common/CommonGIS_AuxMerc/MapServer';
        //     const res = attribute.loadServerAttribs(mapURL, 1);
        //     expect(res.featureIdx).toEqual(1);
        //     res.layerData.then(x => {
        //         expect(x.layerType).toEqual('Feature Layer');
        //         expect(x.geometryType).toEqual('esriGeometryPolygon');
        //         expect(x.minScale).toEqual(0);
        //         expect(x.maxScale).toEqual(0);
        //         expect(x.supportsFeatures).toBe(true);
        //         expect(x.load.attribs).toEqual('*');
        //         done();
        //     })
        //     .catch(e => {
        //         fail(`Exception was thrown ${e}`);
        //         done();
        //     });
        // });

        // it('should work for a Feature Layer requesting a specific attribute', (done) => {
        //     const mapURL = 'http://maps-cartes.ec.gc.ca/arcgis/rest/services/Common/CommonGIS_AuxMerc/MapServer';
        //     const res = attribute.loadServerAttribs(mapURL, 1, 'geometryType');
        //     expect(res.featureIdx).toEqual(1);
        //     res.layerData.then(x => {
        //         expect(x.geometryType).toEqual('esriGeometryPolygon');
        //         expect(x.load.attribs).toEqual('geometryType,OBJECTID');
        //         done();
        //     })
        //     .catch(e => {
        //         fail(`Exception was thrown: ${e}`);
        //         done();
        //     });
        // });

        it('should work for a non-Feature Layer', (done) => {
            spyOn(fakeBundle, 'esriRequest').and.callFake(x => {
                x.type = 'Non-Feature Layer';
                x.geometryType = '';
                x.minScale = 0;
                x.maxScale = 0;
                x.extent = { };
                return Promise.resolve(x);
            });
            const mapURL = 'http://maps-cartes.ec.gc.ca/arcgis/rest/services/Common/CommonGIS_AuxMerc/MapServer';
            const res = attribute.loadServerAttribs(mapURL, '1');
            expect(res.featureIdx).toEqual('1');
            res.layerData.then(x => {
                expect(x.layerType).toEqual('Non-Feature Layer');
                expect(x.supportsFeatures).toBe(false);
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

    describe('loadFileAttribs', () => {
        it('should work for a Feature Layer', (done) => {
            const layer = {
                objectIdField: 'OBJECTID',
                graphics: {
                    map: () => {
                        const arr = [
                           {
                               attributes: { OBJECTID: 'one' }
                           },
                           {
                               attributes: { OBJECTID: 'two' }
                           }
                        ];
                        return arr;
                    }
                },
                fields: { },
                geometryType: 'esriGeometryPolygon',
                minScale: 0,
                maxScale: 0,
                renderer: {
                    toJson: () => { return; }
                }
            };
            const res = attribute.loadFileAttribs(layer);
            expect(res.featureIdx).toEqual('0');
            res.layerData.then(x => {
                expect(x.layerType).toEqual('Feature Layer');
                expect(x.geometryType).toEqual('esriGeometryPolygon');
                expect(x.minScale).toEqual(0);
                expect(x.maxScale).toEqual(0);
                expect(x.oidField).toEqual('OBJECTID');
                done();
            })
            .catch(e => {
                fail(`Exception was thrown ${e}`);
                done();
            });
        });

    });

});
