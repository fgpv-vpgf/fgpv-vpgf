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

    function fakeEsriExtent(xmin, ymin, xmax, ymax, spatialReference) {
        return { xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax, spatialReference: spatialReference };
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

});
