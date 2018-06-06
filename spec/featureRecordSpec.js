/* jshint jasmine: true */
'use strict';

const featureRecordModule = require('../src/layer/layerRec/featureRecord.js');

// A class that mocks the Extent class
class FakeExtent {
    constructor (height, width) {
        if (height) { this._height = height; } else { this._height = 2; }
        if (width) { this._width = width; } else { this._width = 2; }
    }

    centerAt (point) { return new FakeExtent(point.x / 2, point.y / 2); }
    getWidth () { return this._width; }
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
    constructor () {}
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
        this._opacity = 1;
        this._visibility = 2;
    }

    get opacity () { return this._opacity; }
    get visibility () { return this._visibility; }

    set opacity (val) { this._opacity = val; }
    set visibility (val) { this._visibility = val; }
}

// A class that mocks the configutation layer class
class Config {
    constructor (extent, state) {
        this._id = 113;
        if (extent) { this._extent = extent; } else {  this._extent = new FakeExtent(); }
        if (state) { this._state = state; } else { this._state = new State(); }
    }

    get id () { return this._id; }
    get extent () { return this._extent; }
    get state () { return this._state; }

    set id (val) { this._id = val; }
    set extent (val) { this._extent = val; }
    set state (val) { this._state = val; }
}

// A class that mocks the pre-constructed layer from esri
class EsriLayer {
    constructor () {
        this._graphics = [];
        this._url = 'www.url.io';
    }

    get graphics () { return this._graphics; }
    get url () { return this._url; }
}

// A class that mocks the ESRI API class esriRequest
class EsriRequest {
    constructor () {}
}

describe('featureRecord', () => {
    let featureRecord;
    const layerClass = new FakeLayer();
    const esriRequest = new EsriRequest();
    const apiRef = new ApiRef();
    const config = new Config();
    const esriLayer = new EsriLayer();

    beforeEach(() => {
        featureRecord = featureRecordModule();
    });

    it('should create a featureRecord object', () => {
        const featureRecordObject = new featureRecord.FeatureRecord(layerClass, esriRequest, apiRef, config, esriLayer);

        expect(featureRecordObject).not.toBe(undefined);
    });

    it('should create a layer config', () => {
        const featureRecordObject = new featureRecord.FeatureRecord(layerClass, esriRequest, apiRef, config, esriLayer);
        let cfg = featureRecordObject.makeLayerConfig();

        expect(cfg.id).toEqual(113);
        expect(cfg.opacity).toEqual(1);
        expect(cfg.visible).toEqual(2);
    });

    it('should return the proxy', () => {
        const featureRecordObject = new featureRecord.FeatureRecord(layerClass, esriRequest, apiRef, config, esriLayer);

        let proxy = featureRecordObject.getProxy();
        expect(proxy).not.toBe(undefined);
    });

    it('should return string file iff it is a file layer, string esri otherwise', () => {
        const featureRecordObject = new featureRecord.FeatureRecord(layerClass, esriRequest, apiRef, config, esriLayer);

        expect(featureRecordObject.dataSource()).toBe('esri');
    });

    it('should have no errors when onMouseOver was called', () => {
        const featureRecordObject = new featureRecord.FeatureRecord(layerClass, esriRequest, apiRef, config, esriLayer);

        // should not return an error
        featureRecordObject.onMouseOver();
    });

    it('should return an object with identify results array ', () => {
        const featureRecordObject = new featureRecord.FeatureRecord(layerClass, esriRequest, apiRef, config, esriLayer);
        let idObj = featureRecordObject.identify();

        expect(idObj).not.toBe(undefined);
    });
});
