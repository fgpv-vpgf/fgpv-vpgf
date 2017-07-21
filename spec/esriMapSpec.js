/* jshint jasmine: true */
'use strict';
global.window = {};
global.Element = { prototype: {} };
global.Sizzle = {};
const esriMap = require('../src/map/esriMap.js');

describe('ESRI Map', () => {
    const fakeEsri = {
        esriConfig: { defaults: { io: {} } },
        Extent: fakeEsriExtent,
        Map: function () { return {
            setExtent: () => { return Promise.resolve('done'); } }; 
        },
        BasemapGallery: function () { return { add: () => {}, startup: () => {}, on: () => {} }; },
        BasemapLayer: function () { return {}; },
        Basemap: function () { return {}; }
    };

    const jsonExtent = {
        uid: 'gray',
        type: 'full',
        xmin: -2681457,
        ymin: -883440,
        xmax: 3549492,
        ymax: 3482193,
        spatialReference: {
            wkid: 3978
        }
    };

    const mapConfig = {
        basemaps: [{ layers: ['random url'] }],
        extent: jsonExtent,
        lods: []
    };

    function fakeEsriExtent(json) {
        return { xmin: json.xmin, ymin: json.ymin, xmax: json.xmax, ymax: json.ymax,
            spatialReference: { wkid: json.wkid } };
    }

    const Map = esriMap(fakeEsri);

    it('should allow the setting of a proxy', () => {
        const m = new Map(null, mapConfig);
        m.proxy = 'test';
        expect(fakeEsri.esriConfig.defaults.io.proxyUrl).toBe('test');
    });

    it('should allow get extent from JSON', () => {
        let testExtent = Map.getExtentFromJson(jsonExtent);
        expect(testExtent.xmin).toBe(jsonExtent.xmin);
    });

    it('should not enforce a valid extent range', () => {
        const result = Map.clipExtentCoords(434017.5, 3549492, -2681457, 3549492, -2681457, 6230949);
        expect(result[0]).toBeCloseTo(3549492);
        expect(result[1]).toBeCloseTo(-2681457);
    });

    it('should enforce a too high extent range', () => {
        const result = Map.clipExtentCoords(3549496, 3549500, 3549492, 3549492, -2681457, 8);
        expect(result[0]).toBeCloseTo(3549492);
        expect(result[1]).toBeCloseTo(3549484);
    });

    it('should enforce a too low extent range', () => {
        const result = Map.clipExtentCoords(-2681463.5, -2681457, -2681470, 3549492, -2681457, 13);
        expect(result[0]).toBeCloseTo(-2681444);
        expect(result[1]).toBeCloseTo(-2681457);
    });

    // TODO resolve why this test gives "Map.zoomToExtent is not a function"
    //      it certainly appears to be a function
    xit('should zoom the map to an extent', (done) => {
        const result = Map.zoomToExtent(Map.getExtentFromJson(jsonExtent));
        result.then( value => {
            expect(value).toBe('done');
            done();
        })
    });

});
