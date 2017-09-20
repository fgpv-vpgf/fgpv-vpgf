import proj4 from 'proj4';

/* jshint jasmine: true */
const projBuilder = require('../src/proj.js');

let fakeEsri = {
    EsriExtent: {},
    GeometryService: () => {},
    ProjectParameters: () => {}
};

function makeFakeEsriExtent(o) {
    return {
        xmin:o.x0, ymin:o.y0, xmax:o.x1, ymax:o.y1,
        spatialReference:{ wkid:o.sr }
    };
}

function mockEpsgLookup(code) {
    if (code === 'EPSG:26914') {
        return Promise.resolve('+proj=utm +zone=14 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    }
    return Promise.resolve(null);
}

const sampleWktExtent = {
    xmin: -2293629.397399999,
    ymin: -685380.4041000009,
    xmax: 3298303.1630000025,
    ymax: 3796096.4499000013,
    spatialReference: { wkt: 'PROJCS["Lambert_Conformal_Canada_NAD83",GEOGCS["GCS_North_American_1983",' +
    'DATUM["D_North_American_1983",SPHEROID["Geodetic_Reference_System_of_1980",6378137.0,298.2572221008916]],' +
    'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],' +
    'PARAMETER["false_easting",0.0],PARAMETER["false_northing",0.0],PARAMETER["central_meridian",-95.0],' +
    'PARAMETER["standard_parallel_1",77.0],PARAMETER["standard_parallel_2",49.0],' +
    'PARAMETER["latitude_of_origin",49.0],UNIT["Meter",1.0]]' }
};

// describe declares a test suite
// takes a suite name and a function, all tests within the suite are declared within the function
// besides grouping tests together suites can also do a setup / teardown for each test or for the whole suite
describe('Local projection', () => {

    // make up some data for testing
    const sampleData = { x0:-95, y0:49, x1:-94.5, y1:49.5, sr:4326 };
    const sampleExtent = makeFakeEsriExtent(sampleData);
    let proj;

    proj4.defs('EPSG:3978', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 ' +
    '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:3979', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 ' +
    '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:102100', proj4.defs('EPSG:3857'));
    proj4.defs('EPSG:54004', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs');

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
        res = proj.localProjectExtent(makeFakeEsriExtent(res), 4326);
        'x0 x1 y0 y1'.split(' ').forEach(x => expect(res[x]).toBeCloseTo(sampleData[x], 5));
    });

    it('should project a single point', () => {
        const res = proj.localProjectPoint(4326, 54004, [-95, 49]);
        expect(res[0]).toBeCloseTo(-10575351.62536099);
        expect(res[1]).toBeCloseTo(6242595.999953201);
    });

    it('should project an extent with a WKT spatial reference', () => {
        const res = proj.localProjectExtent(sampleWktExtent, 4326);
        const expectedRes = { x0:-172.14169532688865, y0:34.89804295089334, x1:-11.276472960723352,
            y1:83.27265193258071 }; // jshint ignore:line
        'x0 x1 y0 y1'.split(' ').forEach(x => expect(res[x]).toBeCloseTo(expectedRes[x], 5));
    });

    it('should project a point with a WKT spatial reference', () => {
        const res = proj.localProjectPoint(sampleWktExtent.spatialReference.wkt, 4326,
            [-2293629.397399999, -685380.4041000009]); // jshint ignore:line
        expect(res[0]).toBeCloseTo(-120.8064032804029);
        expect(res[1]).toBeCloseTo(38.828788226505736);
    });

    it('should reproject from mercator to lambert', () => {
        const josmExtent = { type:'extent', xmin:-13316443.76, ymin:6388804.5583, xmax:-10471824.465,
            ymax:9225974.5022, spatialReference:{ wkid:102100 } }; // jshint ignore:line
        const expectedRes = { x0:-1729118.683387185, y0:74576.19391872548, x1:66964.16600783693,
            y1:1810940.2344750422 }; // jshint ignore:line
        let res = proj.localProjectExtent(josmExtent, 3978);
        'x0 x1 y0 y1'.split(' ').forEach(x => expect(res[x]).toBeCloseTo(expectedRes[x], 5));
    });

    it('should not fail silently if a projection is not set', () => {
        expect(() => proj.localProjectExtent(sampleExtent, 111111)).toThrow();
    });

});

describe('geojson reprojection', () => {
    it('should reproject a point', () => {
        const geojsonTestPoint = require('./geojsonTestPoint.json');
        const proj = projBuilder(fakeEsri);
        proj.addProjection('EPSG:3978', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0' +
        ' +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
        proj.projectGeojson(geojsonTestPoint, 'EPSG:3978');
        const pt = geojsonTestPoint.features[0].geometry.coordinates;
        expect(pt[0]).toBeCloseTo(-356765.042);
        expect(pt[1]).toBeCloseTo(125038.026);
    });

});

describe('esri projection conversion function', () => {
    let esri;

    beforeEach(function () {
        // reset esri
        esri = null;
    });

    it('should export esri server projection function', () => {
        // make sure functions are exported properly
        esri = projBuilder(fakeEsri);
        expect(esri.esriServerProject).not.toBe(null);
    });

    // calls fake geosvc and makes sure the parameters are correct
    it('should call esri server from wrapper function', () => {
        let esri = projBuilder(fakeEsri);
        spyOn(fakeEsri, 'GeometryService');
        spyOn(fakeEsri, 'ProjectParameters');

        // fake call to esri server
        let newPt = esri.esriServerProject('http://sncr01wbingsdv1.ncr.' +
         'int.ec.gc.ca/arcgis/rest/services/Utilities/Geometry/GeometryServer', [0], 12345);
        expect(fakeEsri.GeometryService).toHaveBeenCalled();
        expect(fakeEsri.ProjectParameters).toHaveBeenCalled();
        expect(newPt).toEqual(jasmine.any(Promise));
    });

});

describe('spatialReference comparison', () => {
    const srFirst3978 = { wkid: 3978 };
    const srSecond3978 = { wkid: 3978 };
    const srThird10200 = { wkid: 10200 };
    let proj;

    // setup function running before each test
    beforeEach(() => {
        proj = projBuilder(fakeEsri);
    });

    it('should detect same spatial reference', () => {
        expect(proj.isSpatialRefEqual(srFirst3978, srSecond3978)).toBe(true);
    });

    it('should detect different spatial reference', () => {
        expect(proj.isSpatialRefEqual(srFirst3978, srThird10200)).toBe(false);
    });

});

describe('Check valid source projection', () => {
    const srFirst3978 = { wkid: 3978 };
    const sr2fake = { wkid: 23412 };
    let proj;

    // setup function running before each test
    beforeEach(() => {
        proj = projBuilder(fakeEsri);
    });

    it('should be valid spatial reference', () => {
        expect(proj.checkProj(srFirst3978).foundProj).toBe(true);
    });

    it('should not be valid spatial reference', () => {
        expect(proj.checkProj(sr2fake).foundProj).toBe(false);
    });

    it('should allow WKT without validation', () => {
        expect(proj.checkProj({ wkt:'random text' }).foundProj).toBe(true);
    });

    it('should attempt to lookup unknown references if lookup callback is provided (lookup found case)', (done) => {
        const res = proj.checkProj({ wkid: 26914, latestWkid: 26914 }, mockEpsgLookup);
        expect(res.foundProj).toBe(false);
        res.lookupPromise
            .then(found => {
                expect(found).toBe(true);
                done();
            })
            .catch(() => {
                fail('Promise threw an error');
                done();
            });
    });

    it('should attempt to lookup unknown references if lookup callback is provided (lookup failed case)', (done) => {
        const res = proj.checkProj({ wkid: 1234 }, mockEpsgLookup);
        expect(res.foundProj).toBe(false);
        res.lookupPromise
            .then(found => {
                expect(found).toBe(false);
                done();
            })
            .catch(() => {
                fail('Promise threw an error');
                done();
            });
    });

});
