/* jshint jasmine: true */
'use strict';

const queryModule = require('../src/query.js');

// A fake method for QueryTask which is in EsriBundle
function execute(query, returnFeatureSet, returnError) {
    returnFeatureSet(query);
}

// A fake method for featureLayer which is in options
function queryFeatures(query, returnFeatureSet, returnError) {
    returnFeatureSet(query);
}

// A function that makes a fake query for testing purposes
function makeFakeQuery() {
    return new FakeQuery();
}

// A class that mocks the SpatialReference class from Esri
function FakeSpatialReference() {

}

// A class that mocks the FeatureLayer class from Esri
function FakeFeatureLayer() {
    this.queryFeatures = queryFeatures;
}

// A class that mocks the Query class from Esri
function FakeQuery() {
     this.returnGeometry = true;
     this.outFields = null;
     this.where = null;
     this.geometry = null;
     this.spatialRelationship = null;
     this.SPATIAL_REL_INTERSECTS = 'esriSpatialRelIntersects'
     this.outSpatialReference = new FakeSpatialReference();
}

describe('Query', () => {
    var fakeBundle; // mock-up esri bundle
    var queryGeo;   // the module
    var optionsWithUrl;
    var optionsWithFeatureLayer;
    var optionsWithUrlAndFeatureLayer;
    let options;

    beforeEach(() => {
        fakeBundle = {
            Query: makeFakeQuery,
            QueryTask: () => { 
                return {execute: execute} 
            }
        };

        optionsWithUrl = {
            geometry: 'point',
            url:'./'
        }

        optionsWithFeatureLayer = {
            geometry: 'point',
            featureLayer: new FakeFeatureLayer()
        }

        optionsWithUrlAndFeatureLayer = {
            geometry: 'point',
            url:'./',
            featureLayer: new FakeFeatureLayer(),
            outFields: 'outfields',
            where: "letter = b",
            returnGeometry: true,
            outSpatialReference: new FakeSpatialReference()
        }

        queryGeo = queryModule(fakeBundle);

    });

    /** 
     * query.spatialRelationship was not tested because 
     * esriBundle.Query does not return a Query object but rather
     * a function that returns a Query object therefore
     * it is difficult to test on a mock the esri bundle
     */
    it ('checks whether query atrributes matches options atrributes from the user', (done) => {
        options = optionsWithUrlAndFeatureLayer;
 
        spyOn(fakeBundle, 'Query').and.callThrough();
        spyOn(fakeBundle, 'QueryTask').and.callThrough();
        const query = queryGeo.queryGeometry(options);
        expect(fakeBundle.Query).toHaveBeenCalled();
        expect(fakeBundle.QueryTask).toHaveBeenCalled();
        
        // when the promise returns
        query.then(value => {
                expect(value.outSpatialReference).toEqual(options.outSpatialReference);
                expect(value.outFields).toEqual(options.outFields);
                expect(value.where).toEqual(options.where);
                expect(value.geometry).toEqual(options.geometry);
                done();
            }
        ).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
    });

    it('takes in options with url but not featureLayer and should return a query', (done) => {
        options = optionsWithUrl;

        spyOn(fakeBundle, 'Query').and.callThrough();
        spyOn(fakeBundle, 'QueryTask').and.callThrough();
        const query = queryGeo.queryGeometry(options);
        expect(fakeBundle.Query).toHaveBeenCalled();
        expect(fakeBundle.QueryTask).toHaveBeenCalled();
        
        // when the promise returns
        query.then(value => {
                expect(value.geometry).toEqual('point');
                done();
            }
        ).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
       
    });

    it ('takes in options with featureLayer but not url and should return a query', (done) => {
        options = optionsWithFeatureLayer;

        spyOn(fakeBundle, 'Query').and.callThrough();
        const query = queryGeo.queryGeometry(options);
        expect(fakeBundle.Query).toHaveBeenCalled();

        // when the promise returns
        query.then(value => {
                expect(value.geometry).toEqual('point');
                done();
            }
        ).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
    });

    it('takes in options with url and featureLayer and should return a query', (done) => {
        options = optionsWithUrlAndFeatureLayer;

        spyOn(fakeBundle, 'Query').and.callThrough();
        spyOn(fakeBundle, 'QueryTask').and.callThrough();
        const query = queryGeo.queryGeometry(options);
        expect(fakeBundle.Query).toHaveBeenCalled();
        expect(fakeBundle.QueryTask).toHaveBeenCalled();
        
        // when the promise returns
        query.then(value => {
                expect(value.geometry).toEqual('point');
                done();
            }
        ).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
    });
});
