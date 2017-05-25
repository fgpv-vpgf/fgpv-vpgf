/* jshint jasmine: true */
'use strict';
const symbology = require('../src/symbology.js')();

describe('test for getting correct zoom level', () => {
    const lods =
        [
            { level: 0, resolution: 38364.660062653464, scale: 145000000 },
            { level: 1, resolution: 22489.62831258996, scale: 85000000 },
            { level: 2, resolution: 13229.193125052918, scale: 50000000 },
            { level: 3, resolution: 7937.5158750317505, scale: 30000000 },
            { level: 4, resolution: 4630.2175937685215, scale: 17500000 },
            { level: 5, resolution: 2645.8386250105837, scale: 10000000 },
            { level: 6, resolution: 1587.5031750063501, scale: 6000000 },
            { level: 7, resolution: 926.0435187537042, scale: 3500000 },
            { level: 8, resolution: 529.1677250021168, scale: 2000000 },
            { level: 9, resolution: 317.50063500127004, scale: 1200000 },
            { level: 10, resolution: 185.20870375074085, scale: 700000 },
            { level: 11, resolution: 111.12522225044451, scale: 420000 },
            { level: 12, resolution: 66.1459656252646, scale: 250000 },
            { level: 13, resolution: 38.36466006265346, scale: 145000 },
            { level: 14, resolution: 22.48962831258996, scale: 85000 },
            { level: 15, resolution: 13.229193125052918, scale: 50000 },
            { level: 16, resolution: 7.9375158750317505, scale: 30000 },
            { level: 17, resolution: 4.6302175937685215, scale: 17500 }
        ];

    it('should get the highest zoom level', () => {
        expect(symbology.getZoomLevel(lods, 0)).toEqual(17);
    });

    it('should get lowest zoom level', () => {
        expect(symbology.getZoomLevel(lods, 145000000)).toEqual(0);
    });

    it('should get proper zoom level', () => {
        expect(symbology.getZoomLevel(lods, 4500000)).toEqual(6);
    });

});
