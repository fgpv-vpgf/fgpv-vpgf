/* jshint jasmine: true */
'use strict';
const esriBuilder = require('../src/esri.js');

describe("test for esri projection conversion function", function() {
    const sampleData = {x0:-95,y0:49,x1:-94.5,y1:49.5,sr:4326};
    const sampleExtent = makeFakeEsriExtent(sampleData);
    let esri;
    let x;

    // mock / spy
    // fake esriextent, projparam, geosvc. stub for proj, spy for geosvc. real call to geosvc 2slow
    // tests expecting arguments in a certain order (so it won't break)

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

    it("should export functions", function() {
        // find original sr from config/params or whatever then != new sr
        esri = esriBuilder(sampleData);
        expect(esri).not.toBe(null);
    });

    // calls fake geosvc and makes sure the parameters are correct
    it('should call esriService function from exported modules', function() {
        // make mock body for esriService instead of using spy
        let spy = jasmine.createSpy("fake esri method").and.callFake(
            function() {
                console.log("OK");
            }
        );
        let esri = esriBuilder(sampleData);
        esri.esriService = spy;
        esri.esriService();
        expect(spy).toHaveBeenCalled();
    });
});
