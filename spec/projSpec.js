/* jshint jasmine: true */
'use strict';
const projBuilder = require('../src/proj.js');
const proj4 = require('proj4');

describe('Local projection', () => {
    let fakeEsri = { EsriExtent: {} };
    const sampleExtent = {
        "xmin":-122.68,"ymin":45.53,"xmax":-122.45,"ymax":45.6,
        "spatialReference":{"wkid":4326}
    };

    proj4.defs("EPSG:3978", "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:3979", "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:102100", proj4.defs('EPSG:3857'));
    proj4.defs("EPSG:54004", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");

    it('should reproject extents', () => {
        const proj = projBuilder(fakeEsri);
        let res = proj.localProjectExtent(sampleExtent, 3978);
        expect(res.sr).toEqual(3978);
    });

});
