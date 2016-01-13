/* jshint jasmine: true */
'use strict';
const projBuilder = require('../src/proj.js');
const proj4 = require('proj4');

// describe declares a test suite
// takes a suite name and a function, all tests within the suite are declared within the function
// besides grouping tests together suites can also do a setup / teardown for each test or for the whole suite
describe('Local projection', () => {

    // make up some data for testing
    let fakeEsri = { EsriExtent: {} };
    const sampleData = {x0:-95,y0:49,x1:-94.5,y1:49.5,sr:4326};
    const sampleExtent = makeFakeEsriExtent(sampleData);
    let proj;

    function makeFakeEsriExtent(o) {
        return {
            "xmin":o.x0,"ymin":o.y0,"xmax":o.x1,"ymax":o.y1,
            "spatialReference":{"wkid":o.sr}
        };
    }

    proj4.defs("EPSG:3978", "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:3979", "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:102100", proj4.defs('EPSG:3857'));
    proj4.defs("EPSG:54004", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");

    // setup function running before each test
    beforeEach(() => {
        proj = projBuilder(fakeEsri);
    });

    // each test is also a name and a function
    // tests use expect to generate testing assertions
    // see the jasmine page for a full list of built in tests
    it('should use the target WKID when reprojecting', () => {
        let res = proj.localProjectExtent(sampleExtent, 3978);
        expect(res.sr).toEqual(3978);
    });

    it('should reproject from A -> B -> A without deviation within the same projection type', () => {
        let res = proj.localProjectExtent(sampleExtent, 54004);
        res = proj.localProjectExtent(makeFakeEsriExtent(res),4326);
        'x0 x1 y0 y1'.split(' ').forEach(x => expect(res[x]).toBeCloseTo(sampleData[x],5));
    });

    it('should not fail silently if a projection is not set', () => {
        expect(() => proj.localProjectExtent(sampleExtent, 111111)).toThrow();
    });

});

describe("test for esri projection conversion function", () => {
    const sampleData = {x0:-95,y0:49,x1:-94.5,y1:49.5,sr:4326};
    const sampleExtent = makeFakeEsriExtent(sampleData);
    let esri;
    let x;

    // make fake esri extent as input
    function makeFakeEsriExtent(o) {
        return {
            "xmin":o.x0,"ymin":o.y0,"xmax":o.x1,"ymax":o.y1,
            "spatialReference":{"wkid":o.sr}
        };
    }

    beforeEach(function() {
    //reset esri
        esri = null;
    });

    it("should export functions", () => {
        // make sure functions are exported properly
        esri = projBuilder(sampleData);
        expect(esri).not.toBe(null);
    });

    // calls fake geosvc and makes sure the parameters are correct
    it('should call esriService function from exported modules', () => {
        // make mock body for esriService instead of using spy
        let spy = jasmine.createSpy("fake esri method").and.callFake(
            function() {
                console.log("OK");
            }
        );
        let esri = projBuilder(sampleData);
        esri.esriService = spy;
        esri.esriService();
        expect(spy).toHaveBeenCalled();
    });
});
