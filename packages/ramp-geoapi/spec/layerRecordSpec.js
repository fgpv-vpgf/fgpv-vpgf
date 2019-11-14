/* jshint jasmine: true */
'use strict';

const layerRecordModule = require('../src/layer/layerRec/layerRecord.js');

// A class that mocks the Point class from Esri
class FakePoint {
    constructor (x, y) {
        this._x = x;
        this._y = y;
    }

    get x () { return this._x; }
    get y () { return this._y; }

    set x (val) { this._x = val; }
    set y (val) { this._y = val; }
}

// A class that mocks the Extent class
class FakeExtent {
    constructor (height, width) {
        if (height) { this._height = height; } else { this._height = 2; }
        if (width) { this._width = width; } else { this._width = 2; }
        this._spatialReference = new FakeSpatialReference();
    }

    centerAt (point) { return new FakeExtent(point.x / 2, point.y / 2); }
    getWidth () { return this._width; }
    intersects () { return true; }
    getCenter (point) { return new FakeExtent(point.x / 2, point.y / 2); }
    get spatialReference() { return this._spatialReference; }
}

// A class that mocks the Map class
class FakeMap {
    constructor () {
        this._scale = 113;
        this._extent = new FakeExtent();
    }

    get extent () { return this._extent; }
    get scale () { return this._scale; }

    set extent (val) { this._extent = val; }
    set scale (val) { this._scale = val; }
    setExtent (extent) {
        return new Promise((resolve, reject) => {
            resolve(this._extent = extent);
            reject('Error');
        });
    }
    setScale (scale) {
        return new Promise((resolve, reject) => {
            resolve(this._scale = scale);
            reject('Error');
        });
    }
    centerAt () { return 'sadf'; }
    zoomToExtent (extent) {
        return Promise.resolve(extent);
    }
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

// A class that mocks the pre-constructed layer
class EsriLayer {
    constructor () {
        this._id = 113;
    }

    get id () { return this._id; }

    set id (val) { this.id = val; }
}

// A class that mocks the LOD (level of detail) class
class FakeLOD {
    constructor (level, resolution, scale) {
        if (level) { this._level = level; } else { this._level = 0; }
        if (resolution) { this._resolution = resolution; } else { this._resolution = 113; }
        if (scale) { this._scale = scale; } else { this._scale = 113000; }
    }
    get level () { return this._level; }
    get resolution () { return this._resolution; }
    get scale () { return this._scale; }

    set level (val) { this._level = val; }
    set resolution (val) { this._resolution = val; }
    set scale (val) { this._scale = val; }
}

// Anything with _featClasses was not tested but it should be tested in
// whichever class that inherents this class
describe('layerRecord', () => {
    let layerRecord;
    const FakeLayerObject = new FakeLayer('113');
    const apiRef = new ApiRef();
    const config = new Config();
    const esriLayer = new EsriLayer();
    const lod1 = new FakeLOD();
    const lod2 = new FakeLOD(1, 226, 226000);
    const lod3 = new FakeLOD(3, 339, 339000);
    const lods = [lod3, lod2, lod1]; // LODS default in decreasing scale
    const map = new FakeMap();

    beforeEach(() => {
        layerRecord = layerRecordModule();
    });

    it('should create a layerRecord object', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);

        expect(layerRecordObject).not.toBe(undefined);
    });

    it('should bind events', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        let layer = new FakeLayer();

        // just to see if there is any errors
        layerRecordObject.bindEvents(layer);
    });

    it('should add a state change listener then remove it', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);

        // add the state listener
        let listenerCallback = layerRecordObject.addStateListener('listenerCallback');

        expect(listenerCallback).toEqual('listenerCallback');
        expect(layerRecordObject._stateEvent._listeners.includes('listenerCallback')).toBe(true);

        // remove the state listener
        layerRecordObject.removeStateListener('listenerCallback');

        expect(layerRecordObject._stateEvent._listeners.includes('listenerCallback')).toBe(false);
    });

    it('should add hover listener then remove it', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);

        // add the state listener
        let listenerCallback = layerRecordObject.addHoverListener('listenerCallback');

        expect(listenerCallback).toEqual('listenerCallback');
        expect(layerRecordObject._hoverEvent._listeners.includes('listenerCallback')).toBe(true);

        // remove the state listener
        layerRecordObject.removeHoverListener('listenerCallback');

        expect(layerRecordObject._hoverEvent._listeners.includes('listenerCallback')).toBe(false);
    });

    it('should create an option object for the physical layer', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        let option = layerRecordObject.makeLayerConfig();

        expect(option.opacity).toEqual(layerRecordObject.config.state.opacity);
        expect(option.visible).toEqual(layerRecordObject.config.state.visibility);

    });

    it('should figure out the visibility', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        const zoomIn = true;
        const scaleSet = {
            minScale: 300000,
            maxScale: 100000
        };

        let output = layerRecordObject.findZoomScale(lods, scaleSet, zoomIn);
        expect(output).toEqual(lod2);
    });

    it('should set the map scale', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        const zoomIn = true;
        let mapDone = layerRecordObject.setMapScale(map, lod1, zoomIn);

        expect(mapDone).not.toBe(undefined);
    });

    it('should zoom to boundary', (done) => {
        config.extent = new FakeExtent();
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        let promise = layerRecordObject.zoomToBoundary(map);

        promise.then(val => {
            expect(val).toEqual(layerRecordObject.extent);
            done();
        }).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
    });

    it('should get visible scale', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);

        let scale = layerRecordObject.getVisibleScales();
        expect(scale).not.toBe(undefined);
    });

    it('should get feature count', (done) => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        let promise = layerRecordObject.getFeatureCount();

        promise.then(val => {
            expect(val).toEqual(0);
            done();
        }).catch(e => {
            fail(`Exception was thrown: ${e}`);
            done();
        });
    });

    it('should make a click buffer', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);
        const point = new FakePoint(1, 3);

        let extent = layerRecordObject.makeClickBuffer(point, map);
        expect(extent).not.toBe(undefined);
    });

    it('should retrn the geometry type', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);

        // should be undefined
        let geomType = layerRecordObject.getGeomType();
        expect(geomType).toBe(undefined);
    });

    it('should return the proxy interface', () => {
        const layerRecordObject = new layerRecord.LayerRecord(FakeLayerObject, apiRef, config, esriLayer);

        let proxy = layerRecordObject.getProxy();
        expect(proxy).not.toBe(undefined);
    });
});
