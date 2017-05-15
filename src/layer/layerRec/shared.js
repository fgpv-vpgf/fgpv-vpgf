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

function parseUrlIndex(url) {
    // break url into root and index

    // note we are returning index as a string for now.
    const result = {
        rootUrl: url,
        index: '0'
    };
    const re = /\/(\d+)\/?$/;
    const matches = url.match(re);

    if (matches) {
        result.index = matches[1];
        result.rootUrl = url.substr(0, url.length - matches[0].length); // will drop trailing slash
    } else {
        // give up, dont crash with error.
        // default configuration will make sense for non-feature urls,
        // even though they should not be using this.
        console.warn('Cannot extract layer index from url ' + url);
    }

    return result;
}

/**
 * @class IdentifyResult
 */
class IdentifyResult {
    /**
     * @param  {Object} proxy   proxy to the logical layer containing the results (i.e. a feature class)
     */
    constructor (proxy) {
        // TODO revisit what should be in this class, and what belongs in the app
        // also what can be abstacted to come from layerRec
        this.isLoading = true;
        this.requestId = -1;
        this.requester = {
            proxy
        };
        this.data = [];
    }
}

module.exports = () => ({
    states,
    clientLayerType,
    makeSymbologyArray,
    IdentifyResult,
    parseUrlIndex
});
