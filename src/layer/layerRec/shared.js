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
    ESRI_GRAPHICS: 'esriGraphics',
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
    ESRI_IMAGE: 'esriImage',
    ESRI_TILE: 'esriTile',
    ESRI_GROUP: 'esriGroup',
    ESRI_RASTER: 'esriRaster',
    OGC_WMS: 'ogcWms',
    OGC_WFS: 'ogcWfs',
    UNRESOLVED: 'unresolved',
    UNKNOWN: 'unknown'
};

/**
 * Takes an array of (possibly pending) legend data and constructs an array of default
 * symbology objects. As each legend item loads, the symbology objects are updated.
 *
 * @function makeSymbologyArray
 * @param  {Array} legendData    list of promises that resolve with legend data (svg and labels)
 * @returns {Array} a list of symbology objects.
 */
function makeSymbologyArray(legendData) {
    return legendData.map(item => {

        // items are promises. they resolve when the svg has been renderer.
        // after that happens, we update the internal properties of the symbologyItem
        const symbologyItem = {
            svgcode: null,
            name: null,
            definitionClause: null,
            drawPromise: item.then(data => {
                symbologyItem.svgcode = data.svgcode;
                symbologyItem.name = data.label || '';
                symbologyItem.definitionClause = data.definitionClause;
            })
        };

        return symbologyItem;
    });
}

/**
 * Splits an indexed map server url into an object with .rootUrl and .index
 * properties.
 *
 * @function parseUrlIndex
 * @param  {String} url    an indexed map server url
 * @returns {Object}  the url split into the server root and the index.
 */
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
 * Takes a specific layer state and determines if the layer can be considered
 * loaded or not.
 *
 * @function layerLoaded
 * @param  {String} state    a layer state
 * @returns {Boolean}        if the layer is loaded or not
 */
function layerLoaded(state) {
    switch (state) {
        case states.ERROR:
        case states.LOADING:
        case states.NEW:
            return false;
        default:
            return true;
    }
}

/**
 * Takes an extent. If extent has problematic boundaries, adjust the extent inwards.
 *
 * @function makeSafeExtent
 * @param {Object} extent an extent. Param may be modified in place
 * @return {Object} an extent that has been adjusted if it's too big
 */
function makeSafeExtent(extent) {
    // TODO add more cases to check for as we find them

    // we modify the parameter in-place due to lazyness (i.e. not wanting to generate
    // a new prototyped extent object).  If we find this to be a problem, change
    // the code to make a proper copy (might need some shenanigans to get the
    // extent constructor function in here)

    // if lat/long, back off if too close to poles or anti-prime-meridian
    if (extent.spatialReference.wkid === 4326) {

        const squish = (ext, prop, limit, direction) => {
            if (((ext[prop]) * direction) > (limit * direction)) {
                ext[prop] = limit;
            }
        };

        [['xmin', -179, -1], ['xmax', 179, 1], ['ymin', -89, -1], ['ymax', 89, 1]].forEach(nugget => {
            squish(extent, ...nugget);
        });
    }

    return extent;
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
    parseUrlIndex,
    layerLoaded,
    makeSafeExtent
});
