/* jshint jasmine: true */
'use strict';

const ogcModule = require('../src/layer/ogc.js');

// A class that mocks the Deferred class from dojo
class Deferred {
    constructor () {}
}

// A class that mocks the SpatialReference class from Esri
class FakeSpatialReference {
    constructor () {
        this._wkid = 113;
    }

    get wkid () { return this._wkid; }
    set wkid (id) { this._wkid = id; }
}

// A class that mocks the Extent class from Esri
class FakeExtent {
    constructor () {
        this._xmin = 0;
        this._xmax = 1;
        this._ymin = 0;
        this._ymax = 2;
    }

    get xmin () { return this._xmin; }
    get xmax () { return this._xmax; }
    get ymin () { return this._ymin; }
    get ymax () { return this._ymax; }
    expand (num) {
        return num;
    }
}

// A class that mocks the Map class from Esri
class FakeMap {
    constructor () {
        this._extent = new FakeExtent();
        this._spatRef = new FakeSpatialReference();
        this._width = 1;
        this._height = 2;
    }

    get spatialReference () { return this._spatRef; }
    get extent () { return this._extent; }
    get width () { return this._width; }
    get height () { return this._height; }
}

// A class that mocks the WMSLayerInfo class from Esir
class FakeWMSLayerInfo {
    constructor (name, legendURL) {
        this._name =  name;
        this._subLayers = [];
        this._lengendUrl = legendURL;
    }

    get name () { return this._name; }
    set name (val) { this._name = val; }
    get subLayers () { return this._subLayers; }
    get legendURL () { return this._lengendUrl; }
    addSubLayers (layerInfo) {
        this._subLayers.push(layerInfo);
    }
}

// A class that mocks the WMSLayer class from Esri
class FakeWMSLayer {
    constructor () {
        this._version = '1.3';
        this._imageFormat = 'JPEG';
        this._map = new FakeMap();
        this._url = 'www.wmslayer.com';
        this._spatRefs = [1, 2, 3];
        this._layerInfos = [];
    }

    get version () { return this._version; }
    get spatialReferences () { return this._spatRef; }
    get imageFormat () { return this._imageFormat; }
    get url () { return this._url; }
    get layerInfos () { return this._layerInfos; }

    set version (val) { this._version = val; }

    getMap () { return this._map; }
    addLayerInfo (layerInfo) { this._layerInfos.push(layerInfo); }
}

// A class that mocks the screenPoint class from Esri
class ScreenPoint {
    constructor (x, y) {
        this._x = x;
        this._y = y;
    }

    get x () { return this._x; }
    set x (val) { this._x = val; }
    get y () { return this._y; }
    set y (val) { this._y = val; }
}

// A class that mocks the map click event class from Esri
class FakeClickEvent {
    constructor () {
        this._screenPoint = new ScreenPoint(1, 2);
    }

    set screenPoint (point) { this._screenPoint = point; }

    get screenPoint () { return this._screenPoint; }
}

describe('ogc', () => {
    describe('getFeatureInfoBuilder', () => {
        let ogc;
        const fakeWMSLayerObject = new FakeWMSLayer();
        const fakeClickEventObject = new FakeClickEvent();
        const layerList = ['street', 'traffic', 'transit'];
        const mimeType = 'JPEG';
        const fakeBundle = { // mock-up esri bundle
            esriRequest: (data) => { return data; }
        };

        beforeEach(() => {
            ogc = ogcModule(fakeBundle);
        });

        it('should handle click events for WMS layers', (done) => {
            const layers = layerList.join(',');
            const featureInfoBuilder = ogc.getFeatureInfo(fakeWMSLayerObject,
            fakeClickEventObject, layerList, mimeType);

            // testing the return values in the promise
            featureInfoBuilder.then(val => {
                expect(val.url).toEqual('www.wmslayer.com');
                expect(val.content.I).toEqual(fakeClickEventObject.screenPoint.x);
                expect(val.content.J).toEqual(fakeClickEventObject.screenPoint.y);
                expect(val.content.FORMAT).toEqual(fakeWMSLayerObject.imageFormat);
                expect(val.content.VERSION).toEqual(fakeWMSLayerObject.version);
                expect(val.content.LAYERS).toEqual(layers);
                expect(val.content.INFO_FORMAT).toEqual(mimeType);
                done();
            }).catch(e => {
                fail(`Exception was thrown: ${e}`);
                done();
            });
        });
    });

    describe('parseCapabilities', () => {
        let ogc;
        const wmsEndpoint = 'www.endpoint.io';
        const fakeBundle = { // mock-up esri bundle
            dojoQuery: () => {
                return [];
            },
            esriRequest: function (data) { return new Deferred(data); }
        };

        beforeEach(() => {
            ogc = ogcModule(fakeBundle);
        });

        it('Fetch layer data from a WMS endpoint', (done) => {
            const metadataPromise = ogc.parseCapabilities(wmsEndpoint);

            // calling the promise to see the values
            metadataPromise.then(val => {
                expect(val.layers).not.toBe(undefined);
                expect(val.queryTypes).not.toBe(undefined);
                done();
            }).catch(e => {
                fail(`Exception was thrown: ${e}`);
                done();
            });
        });
    });

    describe('getLegendUrls', () => {
        let ogc;
        const fakeBundle = {}; // mock-up esri bundle
        const fakeWMSLayerObject = new FakeWMSLayer();
        const layerList = [
            {
                id: 'street',
                styleToURL: {
                    'default': 'www.street.io'
                },
                currentStyle: 'default'
            },
            {
                id: 'traffic',
                styleToURL: {
                    'default': 'www.traffic.io'
                },
                currentStyle: 'default'
            },
            {
                id: 'transit',
                styleToURL: {
                    'default': 'www.transit.io'
                },
                currentStyle: 'default'
            }];

        // layerInfos that belong to the layer in layerList
        const street = new FakeWMSLayerInfo('street', 'www.street.io');
        const traffic = new FakeWMSLayerInfo('traffic', 'www.traffic.io');
        const transit = new FakeWMSLayerInfo('transit', 'www.transit.io');

        beforeEach(() => {
            ogc = ogcModule(fakeBundle);
        });

        it('get the legend urls', () => {
            fakeWMSLayerObject.addLayerInfo(street);
            fakeWMSLayerObject.addLayerInfo(traffic);
            fakeWMSLayerObject.addLayerInfo(transit);
            const legendUrls = ogc.getLegendUrls(fakeWMSLayerObject, layerList);

            for (let i = 0; i < legendUrls.length; i++) {
                expect(legendUrls[i]).toEqual(fakeWMSLayerObject.layerInfos[i].legendURL);
            }
        });
    });
});
