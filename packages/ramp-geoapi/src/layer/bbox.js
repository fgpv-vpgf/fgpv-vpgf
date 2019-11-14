'use strict';

// TODO: this module is currently split from layer.js because layer.js is already huge and doesn't need
// more functions we can't find.  When (if ever) we refactor this can probably merge with some other code.

const defaultRenderers = require('../defaultRenderers.json');

function bboxBuilder(esriBundle, apiRef) {
    /**
    * Makes a bounding box layer (a graphics layer with one rectangle graphic matching the supplied extent).
    * @method makeBoundingBox
    * @param {String} id the id of the bounding box to be created
    * @param {EsriExtent} extent an ESRI extent object to be used for the graphics boundaries
    * @param {SpatialReference} targetSr an ESRI spatial reference which is used for projecting the result
    * @return {GraphicsLayer} an ESRI GraphicsLayer
    */
    return (id, extent, targetSr) => {
        const result = new esriBundle.GraphicsLayer({ id, visible: true });
        let projectedExtent = extent;
        if (!apiRef.proj.isSpatialRefEqual(extent.spatialReference, targetSr)) {
            projectedExtent = apiRef.proj.projectEsriExtent(extent, targetSr);
        }
        result.add(new esriBundle.Graphic({
            geometry: projectedExtent,
            symbol: defaultRenderers.boundingBoxPoly.renderer.symbol
        }));
        return result;
    };
}

module.exports = (esriBundle, apiRef) => ({
    makeBoundingBox: bboxBuilder(esriBundle, apiRef)
});
