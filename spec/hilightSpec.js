/* jshint jasmine: true */
'use strict';

const hilightModule = require('../src/hilight.js');

// A class that mocks the Extent class from Esri
function Extent() {
    this.expand = () => {};
}

// A class that mocks layer fomr geoApi
function FakeGeoApiLayerFC() {
    this.getLayerData = () => {
        return new Promise((resolve) => {
            resolve([null]);
        });
    };
}

// A class that mocks fakeGraphicLayer object from Esri
function FakeGraphicLayer() {
    this._map = new FakeMap();
    this.graphics = [];
    this.addMarker = 'marker';
    this.addHilight = 'hilight';
    this.clearHilight = 'clear';
    this.add = g => {
        this.graphics.push(g);
    };
    this.clear = () => {
        this.graphics = [];
    };
}

// A class that mocks the hilight from geoApi
function FakeHilight() {
    this.geomToGraphic = () => {};
    this.cloneLayerGraphic = ()=> { return new FakeGraphic(); };
}

// A class that mocks the Symbology class from geoApi
function FakeGeoApiSymbol() {
    this.getGraphicSymbol = () => {};
}

// A class that mocks the Proj class from geoApi
function FakeProj() {
    this.isSpatialRefEqual = () => { return false; };
    this.localProjectGeometry = () => {};
}

// A class that mocks themap class from Esri
function FakeMap() {
    this.reorderLayer = () => {};
    this.graphicsLayerIds = 'ids';
    this.extent = new Extent();
}

// A class that mocks the Point class from Esri
function FakePoint() {}

// A class that mocks the Symbol class from Esri
function FakeSymbol() {}

// A calss that mocks the Geometry class from Esri
function FakeGeometry() {}

// A class that mocks the Layer class from Esri
function FakeLayer() {
    this.renderer = new FakeRenderer();
    this.attributeBundle = 'bundle';
}

// A class that mocks the Renderer class from Esri
function FakeRenderer() {
    this.getSymbol = () => {
        return 'Text';
    };
}

// A class that mocks the Graphic class from Esri
function FakeGraphic(properties) {
    if (properties) {
        this.geometry = properties.geometry;
    } else {
        this.geometry = 'point';
    }
    this.getLayer = () => { return new FakeLayer(); };
    this.setGeometry = (geometry) => {
        this.geometry = geometry;
    };
}

// A class that mocks jsonUtils from Esri
function FakeJsonUtils() {
    this.fromJson = () => {
        return new FakeSymbol();
    };
}

describe('hilight', () => {
    describe('graphicBuilder', () => {
        const fakeBundle = { // mock-up esri bundle
            Graphic: (properties) => { return new FakeGraphic(properties); },
            symbolJsonUtils: new FakeJsonUtils()
        };
        let fakeGeometryObject;
        let fakeSymbolObject;
        let hilight;

        beforeEach(() => {
            fakeGeometryObject = new FakeGeometry();
            fakeSymbolObject = new FakeSymbol();
            spyOn(fakeBundle, 'Graphic').and.callThrough();
            hilight = hilightModule(fakeBundle);
        });

        it('should generate a graphic from server geometry', () => {
            const graphicLayer = hilight.geomToGraphic(fakeGeometryObject, fakeSymbolObject);
            expect(fakeBundle.Graphic).toHaveBeenCalled();

            expect(graphicLayer.geometry).toEqual(fakeGeometryObject);
            expect(graphicLayer.symbol).toEqual(fakeBundle.symbolJsonUtils.fromJson(fakeSymbolObject));
        });
    });

    describe('get graphicBuilder', () => {
        const fakeBundle = {
            Graphic: (properties) => { return new FakeGraphic(properties); },
            GraphicsLayer: () => { return new FakeGraphicLayer(); }
        };
        const fakeGeoApi = {
            proj: new FakeProj(),
            symbology: new FakeGeoApiSymbol(),
            hilight: new FakeHilight()
        };
        const spatialReference = 'UTM';
        let hilight;

        beforeEach(() => {
            spyOn(fakeGeoApi.proj, 'isSpatialRefEqual').and.callThrough();
            spyOn(fakeGeoApi.proj, 'localProjectGeometry').and.callThrough();
            hilight = hilightModule(fakeBundle, fakeGeoApi);
        });

        it('should return an array of Promises', () => {
            const graphicBundles = [
                {
                    graphic: new FakeGraphic(),
                    source: 'server',
                    layerFC: new FakeGeoApiLayerFC(),
                    featureIdx: 0
                }
            ];
            const graphicLayer = hilight.getUnboundGraphics(graphicBundles, spatialReference);

            expect(fakeGeoApi.proj.isSpatialRefEqual).toHaveBeenCalled();
            expect(fakeGeoApi.proj.localProjectGeometry).toHaveBeenCalled();
            for (let i = 0; i < graphicLayer.lenth; i++) {
                expect(graphicLayer[i] instanceof Promise).toBe(true);
            }
        });

        it('should return the local graphic because source is not server', () => {
            const graphicBundles = [
                {
                    graphic: new FakeGraphic(),
                    source: 'local',
                    layerFC: new FakeGeoApiLayerFC(),
                    featureIdx: 0
                }
            ];
            const graphicLayer = hilight.getUnboundGraphics(graphicBundles, spatialReference);

            for (let i = 0; i < graphicLayer.lenth; i++) {
                expect(graphicLayer[i] instanceof Promise).toBe(true);
            }
        });
    });

    describe('hilightBuilder', () => {
        let hilight;
        const fakeBundle = { // mock-up esri bundle
            // ES6 doesn't work for Graphic
            Graphic: function (properties) { return new FakeGraphic(properties); },
            GraphicsLayer: (properties) => { return new FakeGraphicLayer(properties); }
        };

        beforeEach(() => {
            hilight = hilightModule(fakeBundle);
            spyOn(fakeBundle, 'GraphicsLayer').and.callThrough();
        });

        it('should add a graphic to graphicLayer.graphics[0].geometry', () => {
            const graphicLayer = hilight.makeHilightLayer(fakeBundle);
            let fakePointObject = new FakePoint();

            expect(fakeBundle.GraphicsLayer).toHaveBeenCalled();

            // testing the method addMarker
            graphicLayer.addMarker(fakePointObject);
            expect(graphicLayer.graphics[0].geometry).toEqual(fakePointObject);
        });

        // The case where the graphics layer had active hilight graphics was
        // not tested due to the the graphiics layer was created in hilight
        it('should add graphic or array of graphics to the highlight layer ', () => {
            const graphicLayer = hilight.makeHilightLayer(fakeBundle);
            let FakeHilightGraphicObject = new FakeGraphic();

            // testing the method addHilight
            graphicLayer.addHilight(FakeHilightGraphicObject);
            expect(graphicLayer.graphics[0]).toBe(FakeHilightGraphicObject);
        });

        it('should clear the hilight graphics in the graphic layer', () => {
            const graphicLayer = hilight.makeHilightLayer(fakeBundle);

            // testing the method clearHilight
            graphicLayer.clearHilight();
            expect(graphicLayer.graphics.length).toBe(0);
        });
    });
});
