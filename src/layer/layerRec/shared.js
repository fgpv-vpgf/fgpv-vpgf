'use strict';

// TODO revisit if we still need rv- in these constants.
const states = { // these are used as css classes; hence the `rv` prefix
    NEW: 'rv-new',
    REFRESH: 'rv-refresh',
    LOADING: 'rv-loading',
    LOADED: 'rv-loaded', // TODO maybe loaded and default are the same?
    DEFAULT: 'rv-default', // TODO it appears this is not being used?
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

const dataSources = {
    ESRI: 'esri',
    WFS: 'wfs',
    WMS: 'wms',
    FILE: 'file'
}

// these are "officially supported" types.  our filters can take other names (e.g. a plugin wants to name its own filter)
const filterType = {
    SYMBOL: 'symbol',
    API: 'api', // this would be a default api key. e.g. if someone just does an API filter set with no key parameter, it would use this.
    GRID: 'grid',
    EXTENT: 'extent'
}

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

/**
 * @class FakeEvent
 */
class FakeEvent {
    constructor () {
        this._listeners = [];
    }

    /**
     * Triggers the event (i.e. notifies all listeners)
     *
     * @function fireEvent
     * @private
     * @param {...Object} eventParams   arbitrary set of parameters to pass to the event handler functions
     */
    fireEvent (...eventParams) {
        // if we don't copy the array we could be looping on an array
        // that is being modified as it is being read
        this._listeners.slice(0).forEach(l => l(...eventParams));
    }

    /**
     * Register a function to listen to this event.
     *
     * @function addListener
     * @param {Function} listenerCallback function to call when the event fires
     * @returns {Function} the input function (for fun and reference)
     */
    addListener (listenerCallback) {
        this._listeners.push(listenerCallback);
        return listenerCallback;
    }

    /**
     * Remove a mouse filter listener.
     *
     * @function removeListener
     * @param {Function} listenerCallback function to not call when a filter event happens
     */
    removeListener (listenerCallback) {
        const idx = this._listeners.indexOf(listenerCallback);
        if (idx < 0) {
            throw new Error('Attempting to remove a listener which is not registered.');
        }
        this._listeners.splice(idx, 1);
    }

    get listenerCount () { return this._listeners.length; }
}

/**
 * Determines if two extents are the same.
 *
 * @function areExtentsSame
 * @param {Extent} e1 an extent.
 * @param {Extent} e2 another extent.
 * @return {Boolean} indicates if input extents are the same
 */
function areExtentsSame(e1, e2) {
    if (!(e1 && e2)) {
        // a param was empty/nothing
        return false;
    }
    return e1.xmin === e2.xmin && e1.ymin === e2.ymin && e1.xmax === e2.xmax && e1.ymax === e2.ymax;
}

/**
 * Returns array of common elements. Assumes each array has no duplicates (e.g. no [1,1,2] type arrays).
 * This is mainly used for arrays of object ids
 *
 * @function arrayIntersect
 * @param {Array} a1 an array.
 * @param {Array} a2 another array.
 * @return {Array} array that has elements common to both input arrays
 */
function arrayIntersect(a1, a2) {
    return a1.filter(e => -1 !== a2.indexOf(e));
}

module.exports = () => ({
    states,
    clientLayerType,
    dataSources,
    filterType,
    makeSymbologyArray,
    IdentifyResult,
    parseUrlIndex,
    layerLoaded,
    makeSafeExtent,
    areExtentsSame,
    arrayIntersect,
    FakeEvent
});
