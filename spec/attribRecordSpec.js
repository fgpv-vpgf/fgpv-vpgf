/* jshint jasmine: true */
'use strict';

const attribRecordModule = require('../src/layer/layerRec/attribRecord.js');

// A class that mocks the Extent class
class FakeExtent {
    constructor (height, width) {
        if (height) { this._height = height; } else { this._height = 2; }
        if (width) { this._width = width; } else { this._width = 2; }
        this._spatialReference = new FakeSpatialReference();
    }

    centerAt (point) { return new FakeExtent(point.x / 2, point.y / 2); }
    getWidth () { return this._width; }
    get spatialReference() { return this._spatialReference; }
}

// A class that mocks the layer class from Esri
class FakeLayer {
    constructor (id) {
        this._id = id;
    }

    get id () { return this._id; }
    set id (val) { this._id = val; }
}

// A class that mocks the events module from geoApi
class FakeGeoApiEvents {
    constructor () {}

    wrapEvents () {}
}

// A class that mocks the SpatialReference class
class FakeSpatialReference {
    constructor () {
        this._wkid = 1123;
    }

    get wkid() { return this._wkid; }
}

// A class that mocks the proj module from geoApi
class FakeGeoApiProj {
    constructor () {}

    localProjectExtent () {
        return {
            x0: 0,
            x1: 1,
            y0: 0,
            y2: 2,
            sr: new FakeSpatialReference()
        };
    }
}

// A class that mocks the map module from geoApi
class FakeGeoApiMap {
    constructor () {}

    Extent (x0, y0) { return new FakeExtent(x0, y0); }
}

// A class that mocks the object pointing to geoApi
class ApiRef {
    constructor () {
        this._events = new FakeGeoApiEvents();
        this._proj = new FakeGeoApiProj();
        this._map = new FakeGeoApiMap();
    }

    get events () { return this._events; }
    get proj () { return this._proj; }
    get Map () { return this._map; }

    set events (val) { this._events = val; }
    set proj (val) { this._proj = val; }
    set Map (val) { this._map = val; }
}

// A class that mocks the state class
class State {
    constructor () {
        this._opacity = '1';
        this._visibility = '2';
    }

    get opacity () { return this._opacity; }
    get visibility () { return this._visibility; }

    set opacity (val) { this._opacity = val; }
    set visibility (val) { this._visibility = val; }
}

// A class that mocks the configutation layer class
class Config {
    constructor (extent, state) {
        if (extent) { this._extent = extent; } else {  this._extent = new FakeExtent(); }
        if (state) { this._state = state; } else { this._state = new State(); }
    }

    get extent () { return this._extent; }
    get state () { return this._state; }

    set extent (val) { this._extent = val; }
    set state (val) { this._state = val; }
}

// A class that mocks the pre-constructed layer from esri
class EsriLayer {
    constructor () {
        this._graphics = [];
        this._id = 113;
    }

    get graphics () { return this._graphics; }
    get id () { return this._id; }

    set id (val) { this.id = val; }
}

// A class that mocks the ESRI API class esriRequest
class EsriRequest {
    constructor () {}
}

describe('attribRecord', () => {
    let attribRecord;
    const layerClass = new FakeLayer();
    const esriRequest = new EsriRequest();
    const apiRef = new ApiRef();
    const config = new Config();
    const esriLayer = new EsriLayer();

    beforeEach(() => {
        attribRecord = attribRecordModule();
    });

    it('should create a attribeRecord object', () => {
        const attribRecordObject = new attribRecord.AttribRecord(layerClass, esriRequest, apiRef, config, esriLayer);
        expect(attribRecordObject).not.toBe(undefined);
    });

    it('should return the feature count', (done) => {
        const attribRecordObject = new attribRecord.AttribRecord(layerClass, esriRequest, apiRef, config, esriLayer);
        let featureCount = attribRecordObject.getFeatureCount();

        featureCount.then(val => {
            expect(val >= 0).toBe(true);
            done();
        }).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
    });

    it('should trasnform esri key-value attribute object into key value array with format suitable', () => {
        const attribRecordObject = new attribRecord.AttribRecord(layerClass, esriRequest, apiRef, config, esriLayer);

        let array = attribRecordObject.attributesToDetails({
            a: 'Adrian',
            b: 'Barry',
            p: 'Phoebe'
        });

        expect(array[0].key).toEqual('a');
        expect(array[0].value).toEqual('Adrian');
        expect(array[1].key).toEqual('b');
        expect(array[1].value).toEqual('Barry');
        expect(array[2].key).toEqual('p');
        expect(array[2].value).toEqual('Phoebe');
    });
});
