/* jshint jasmine: true */
'use strict';
const dynamicFCModule = require('../src/layer/layerRec/dynamicFC.js')();

describe('DynamicFC', () => {
    const parent = {
        _apiRef: {
            symbology: {
                generatePlaceholderSymbology: () => { return; }
            },
            layer: {
                LayerDrawingOptions: function () { }
            }
        },
        _layer: {
            visibleLayers: [ ],
            setLayerDrawingOptions: (x) => { parent.testField = x; },
            setVisibleLayers: (x) => { parent.visibleLayers = x; },
            setVisibility: () => { return; },
            refresh: () => {}
        },
        synchOpacity: () => { return; },
        testField: [ ]
    };
    const layerPackage = { };
    const config = {
        state: {
            opacity: 1
        }
    };
    let dynamicFC;
    beforeEach(() => {
        dynamicFC = new dynamicFCModule.DynamicFC(parent, '1', layerPackage, config);
    });

    describe('opacity', () => {
        beforeEach(() => {
            spyOn(parent._apiRef.layer, 'LayerDrawingOptions');
            spyOn(parent._layer, 'setLayerDrawingOptions').and.callThrough();
            spyOn(parent, 'synchOpacity');
            parent.testField = [];
        });

        it('should not change if already equal to value', () => {
            dynamicFC.opacity = 1;
            expect(parent._apiRef.layer.LayerDrawingOptions).not.toHaveBeenCalled();
            expect(parent._layer.setLayerDrawingOptions).not.toHaveBeenCalled();
            expect(parent.synchOpacity).not.toHaveBeenCalled();
            const res = dynamicFC.opacity;
            expect(res).toEqual(1);
        });

        it('should set opacity and layer when supported', () => {
            parent._isTrueDynamic = true;
            dynamicFC.opacity = 0.5;
            expect(parent._apiRef.layer.LayerDrawingOptions).toHaveBeenCalled();
            expect(parent._layer.setLayerDrawingOptions).toHaveBeenCalled();
            expect(parent.synchOpacity).not.toHaveBeenCalled();
            expect(parent.testField[1].transparency).toEqual(50);
            const res = dynamicFC.opacity;
            expect(res).toEqual(0.5);
        });

        it('should update opacity on parent and sibling children when not supported', () => {
            parent._isTrueDynamic = false;
            dynamicFC.opacity = 0.3;
            expect(parent._apiRef.layer.LayerDrawingOptions).not.toHaveBeenCalled();
            expect(parent._layer.setLayerDrawingOptions).not.toHaveBeenCalled();
            expect(parent.synchOpacity).toHaveBeenCalled();
            const res = dynamicFC.opacity;
            expect(res).toEqual(0.3);
        });

    });

    describe('setVisibility', () => {
        beforeEach(() => {
            spyOn(parent._layer, 'setVisibleLayers').and.callThrough();
            spyOn(parent._layer, 'setVisibility');
            parent._layer.visibleLayers = [ ];
            parent._visDelay = {};
        });

        it('should work when adding first visible layer and visibility changes', () => {
            parent._layer.visibleLayers.push(-1);
            dynamicFC.setVisibility(5);
            expect(parent._layer.setVisibleLayers).toHaveBeenCalled();
            expect(parent._layer.setVisibility).not.toHaveBeenCalled();
            expect(parent.visibleLayers).toEqual([1]);
        });

        it('should work when adding visible layer and visibility does not change', () => {
            parent._layer.visibleLayers.push(2);
            dynamicFC.setVisibility(5);
            expect(parent._layer.setVisibleLayers).toHaveBeenCalled();
            expect(parent._layer.setVisibility).not.toHaveBeenCalled();
            expect(parent.visibleLayers).toEqual([2, 1]);
        });

        it('should work when no value and making layer invisible', () => {
            parent._layer.visibleLayers.push(2, 1, 3);
            dynamicFC.setVisibility();
            expect(parent._layer.setVisibleLayers).toHaveBeenCalled();
            expect(parent._layer.setVisibility).not.toHaveBeenCalled();
            expect(parent.visibleLayers).toEqual([2, 3]);
        });

        it('should work when making last layer invisible', () => {
            parent._layer.visibleLayers.push(1);
            dynamicFC.setVisibility();
            expect(parent._layer.setVisibleLayers).toHaveBeenCalled();
            expect(parent._layer.setVisibility).not.toHaveBeenCalled();
            expect(parent.visibleLayers).toEqual([-1]);
        });

    });

});
