/* jshint jasmine: true */
'use strict';

const bboxModule = require('../src/layer/bbox.js');

function makeFakeEsriExtent(o) {
    return {
        xmin:o.x0, ymin:o.y0, xmax:o.x1, ymax:o.y1,
        spatialReference:{ wkid:o.sr }
    };
}

describe('Bounding box', () => {
    let bbox;
    let fakeBundle;
    let fakeProj;
    const sampleData = { x0:-95, y0:49, x1:-94.5, y1:49.5, sr:4326 };
    const sampleExtent = makeFakeEsriExtent(sampleData);
    beforeEach(() => {
        fakeBundle = {
            Graphic: function (x) { return x; },
            GraphicsLayer: function () { return { add: () => null }; }
        };
        fakeProj = {
            isSpatialRefEqual: () => true,
            projectEsriExtent: x => x
        };
        bbox = bboxModule(fakeBundle, { proj: fakeProj });
    });

    it('should make a box', () => {
        spyOn(fakeBundle, 'Graphic').and.callThrough();
        spyOn(fakeBundle, 'GraphicsLayer').and.callThrough();
        bbox.makeBoundingBox(sampleExtent, sampleExtent.spatialReference);
        expect(fakeBundle.Graphic).toHaveBeenCalled();
        expect(fakeBundle.GraphicsLayer).toHaveBeenCalled();
    });

    it('should reproject if necessary', () => {
        fakeProj.isSpatialRefEqual = () => false;
        spyOn(fakeProj, 'projectEsriExtent');
        bbox.makeBoundingBox(sampleExtent, sampleExtent.spatialReference);
        expect(fakeProj.projectEsriExtent).toHaveBeenCalled();
    });

});
