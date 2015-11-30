/* jshint jasmine: true */
'use strict';
var File = require('vinyl');
var es = require('event-stream');
var geoApi = require('../');

describe("test for esri projection conversion function", function() {
  var x;
  beforeEach(function() {
    // set up spy/fake grey map???
    var geoApi = jasmine.createSpy("esriService");
    x = 1;
  })

  afterEach(function() {
    // tear down spy/fake grey map???
  })

  it("should return a spatial reference with given input", function() {
    // expect spatial reference returned not null
    expect(x).toBe(1);
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
