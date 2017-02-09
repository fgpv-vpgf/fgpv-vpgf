'use strict';

// TODO revisit if we still need rv- in these constants.
const states = { // these are used as css classes; hence the `rv` prefix
    NEW: 'rv-new',
    REFRESH: 'rv-refresh',
    LOADING: 'rv-loading',
    LOADED: 'rv-loaded', // TODO maybe loaded and default are the same?
    DEFAULT: 'rv-default',
    ERROR: 'rv-error'
};

// these match strings in the client.
const clientLayerType = {
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
    ESRI_IMAGE: 'esriImage',
    ESRI_TILE: 'esriTile',
    ESRI_GROUP: 'esriGroup',
    ESRI_RASTER: 'esriRaster',
    OGC_WMS: 'ogcWms',
    UNRESOLVED: 'unresolved',
    UNKNOWN: 'unknown'
};

// legend data is our modified legend structure.
// it is similar to esri's server output, but all individual
// items are promises.
// TODO proper docs
function makeSymbologyArray(legendData) {
    return legendData.map(item => {

        const symbologyItem = {
            svgcode: null,
            name: null
        };

        // file-based layers don't have symbology labels, default to ''
        // legend items are promises
        item.then(data => {
            symbologyItem.svgcode = data.svgcode;
            symbologyItem.name = data.label || '';
        });

        return symbologyItem;
    });
}

/**
 * @class IdentifyResult
 */
class IdentifyResult {
    /**
     * @param  {String} name      layer name of the queried layer
     * @param  {Array} symbology array of layer symbology to be displayed in details panel
     * @param  {String} format    indicates data formating template
     * @param  {Object} layerRec  layer record for the queried layer
     * @param  {Integer} featureIdx  optional feature index of queried layer (should be provided for attribute based layers)
     * @param  {String} caption   optional captions to be displayed along with the name
     */
    constructor (name, symbology, format, layerRec, featureIdx, caption) {
        // TODO revisit what should be in this class, and what belongs in the app
        // also what can be abstacted to come from layerRec
        this.isLoading = true;
        this.requestId = -1;
        this.requester = {
            name,
            symbology,
            format,
            caption,
            layerRec,
            featureIdx
        };
        this.data = [];
    }
}

module.exports = () => ({
    states,
    clientLayerType,
    makeSymbologyArray,
    IdentifyResult
});
