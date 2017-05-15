/* jshint jasmine: true */
'use strict';

const queryModule = require('../src/query.js');

// A class that mocks the SpatialReference class from Esri
function FakeSpatialReference() {}

// A class that mocks the FeatureLayer class from Esri
function FakeFeatureLayer() {
    this.queryFeatures = 
        (query, returnFeatureSet, returnError) => {
            returnFeatureSet(query);
        }
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
    const fakeBundle = {
            Query: () => {return new FakeQuery();},
            QueryTask: () => { 
                return {
                    execute: (query, returnFeatureSet, returnError) => {
                        returnFeatureSet(query);
                    }
                } 
            }
        }
    var queryGeo;   // the module

    beforeEach(() => {
        spyOn(fakeBundle, 'Query').and.callThrough();
        spyOn(fakeBundle, 'QueryTask').and.callThrough();
        queryGeo = queryModule(fakeBundle);
    });

    /** 
     * query.spatialRelationship was not tested because 
     * esriBundle.Query does not return a Query object but rather
     * a function that returns a Query object therefore
     * it is difficult to test on a mock the esri bundle
     */
    it ('checks whether query atrributes matches options atrributes from the user', (done) => {
        var options = {
            geometry: 'point',
            url:'./',
            featureLayer: new FakeFeatureLayer(),
            outFields: 'outfields',
            where: "letter = b",
            returnGeometry: true,
            outSpatialReference: new FakeSpatialReference()
        }

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
        var options = {
            geometry: 'point',
            url:'./'
        }

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
        var options = {
            geometry: 'point',
            featureLayer: new FakeFeatureLayer()
        }

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
         var options = {
            geometry: 'point',
            url:'./',
            featureLayer: new FakeFeatureLayer(),
            outFields: 'outfields',
            where: "letter = b",
            returnGeometry: true,
            outSpatialReference: new FakeSpatialReference()
        }

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
