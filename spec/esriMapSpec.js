/* jshint jasmine: true */
'use strict';
global.window = {};
global.Element = { prototype: {} };
global.Sizzle = {};
const esriMap = require('../src/map/esriMap.js');

// A class that mocks the ESRI bundle
class FakeEsri {
    constructor() {
        this._esriConfig = { defaults: { io: {} } }
    }
    get esriConfig() {
        return this._esriConfig;
    }
    Extent() {
        if (arguments.length === 1 ) {
            return { xmin: arguments[0].xmin, ymin: arguments[0].ymin, xmax: arguments[0].xmax, ymax: arguments[0].ymax,
            spatialReference: { wkid: arguments[0].wkid } };
        } else {
            return { xmin: arguments[0], ymin: arguments[1], xmax: arguments[2], ymax: arguments[3],
                spatialReference: { wkid: 3978 } };
        }
    }
    Map() { return {
        setExtent: () => { return Promise.resolve('done'); } };
    }
    BasemapGallery() { return { add: () => {}, startup: () => {}, on: () => {} }; }
    BasemapLayer() { return {}; }
    Basemap() { return {}; }
}

describe('ESRI Map', () => {
    const fakeEsri = new FakeEsri();

    const fakeGeoApi = {
        proj: {
            localProjectExtent: () => {
                return jsonExtent;
            }
        }
    }

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
        basemaps: [{ _layers: ['random url'] }],
        extent: jsonExtent,
        lods: []
    };

    function fakeEsriExtent(json) {
        return { xmin: json.xmin, ymin: json.ymin, xmax: json.xmax, ymax: json.ymax,
            spatialReference: { wkid: json.wkid } };
    }

    const Map = esriMap(fakeEsri, fakeGeoApi);

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

    it('should zoom the map to an extent', (done) => {
        const mapObj = new Map(fakeEsri, mapConfig);
        const result = mapObj.zoomToExtent(Map.getExtentFromJson(jsonExtent));
        result.then(value => {
            expect(value).toBe('done');
            done();
        })
    });

});
