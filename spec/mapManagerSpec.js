/* jshint jasmine: true */
'use strict';
const mapManagerInit = require('../src/mapManager.js');

describe('Map Manager', () => {
    const fakeEsri = {
        esriConfig: { defaults: { io: {} } }
    };
    const mapManager = mapManagerInit(fakeEsri);

    it('should allow the setting of a proxy', () => {
        mapManager.setProxy('test');
        expect(fakeEsri.esriConfig.defaults.io.proxyUrl).toBe('test');
    });
});
