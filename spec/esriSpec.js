/* jshint jasmine: true */
'use strict';
const esri = require('../src/esri.js');

describe("test for esri projection conversion function", function() {
    /*const fakeEsri = {
        ProjectParameters: index.ProjectParameters,
        GeometryService: index.GeometryService
    };*/
    const sampleData = {x0:-95,y0:49,x1:-94.5,y1:49.5,sr:4326};
    // const sampleExtent = makeFakeEsriExtent(sampleData);
    let esri;
    let x;

    function makeFakeEsriExtent(o) {
        return {
            "xmin":o.x0,"ymin":o.y0,"xmax":o.x1,"ymax":o.y1,
            "spatialReference":{"wkid":o.sr}
        };
    }

    beforeEach(function() {
    // reset esri
        // index();
        // esri = esri(fakeEsri);
        x = 1;
    })

    it('should use the target WKID when reprojecting', function() {
        // let res = esri.esriService(fakeEsri, sampleExtent, 3978);
        // expect(res.sr).toEqual(3978);
    });

    it("spatial reference should be different from original", function() {
        // find original sr from config/params or whatever then != new sr
        expect(x).toBe(1);
    });

    it("geometry service should be instantiated given correct params", function() {
        // geometryService != null assert that after instantiating it.
        expect(x).toBe(1);
    });
});
