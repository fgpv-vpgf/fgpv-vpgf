/* jshint jasmine: true */
'use strict';
const mapManagerInit = require('../src/mapManager.js');

describe('Map Manager', () => {
    const fakeEsri = {
        esriConfig: { defaults: { io: {} } }, Extent: fakeEsriExtent
    };

    const jsonExtent = {
        "uid": "gray",
        "type": "full",
        "xmin": -2681457,
        "ymin": -883440,
        "xmax": 3549492,
        "ymax": 3482193,
        "spatialReference": {
          "wkid": 3978
        }
    };

    function fakeEsriExtent(json) {
        return { xmin: json.xmin, ymin: json.ymin, xmax: json.xmax, ymax: json.ymax,
            spatialReference: { wkid: json.wkid } };
    }

    const mapManager = mapManagerInit(fakeEsri);

    it('should allow the setting of a proxy', () => {
        mapManager.setProxy('test');
        expect(fakeEsri.esriConfig.defaults.io.proxyUrl).toBe('test');
    });

    it('should allow get extent from JSON', () => {
        let testExtent = mapManager.getExtentFromJson(jsonExtent);
        expect(testExtent.xmin).toBe(jsonExtent.xmin);
    });

    it('should not enforce a valid extent range', () => {
        const result = mapManager.clipExtentCoords(434017.5, 3549492, -2681457, 3549492, -2681457, 6230949);
        expect(result[0]).toBeCloseTo(3549492);
        expect(result[1]).toBeCloseTo(-2681457);
    });

    it('should enforce a too high extent range', () => {
        const result = mapManager.clipExtentCoords(3549496, 3549500, 3549492, 3549492, -2681457, 8);
        expect(result[0]).toBeCloseTo(3549492);
        expect(result[1]).toBeCloseTo(3549484);
    });

    it('should enforce a too low extent range', () => {
        const result = mapManager.clipExtentCoords(-2681463.5, -2681457, -2681470, 3549492, -2681457, 13);
        expect(result[0]).toBeCloseTo(-2681444);
        expect(result[1]).toBeCloseTo(-2681457);
    });

});
