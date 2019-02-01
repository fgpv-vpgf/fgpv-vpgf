'use strict';

const shared = require('./shared.js')();
const placeholderFC = require('./placeholderFC.js')();

/**
 * @class BasicFC
 */
class BasicFC extends placeholderFC.PlaceholderFC {
    // base class for feature class object. deals with stuff specific to a feature class (or raster equivalent)

    get queryable () { return this._queryable; }
    set queryable (value) { this._queryable = value; }

    // non-attributes have no geometry.
    // TODO decide on proper defaulting or handling of non-geometry layers.
    get geomType () { return Promise.resolve('none'); }

    /**
     * @param {Object} parent        the Record object that this Feature Class belongs to
     * @param {String} idx           the service index of this Feature Class. an integer in string format. use '0' for non-indexed sources.
     * @param {Object} config        the config object for this sublayer
     */
    constructor (parent, idx, config) {
        super(parent, config.name || '');
        this._idx = idx;
        this.queryable = config.state.query;
        this.extent = config.extent;  // if missing, will fill more values after layer loads

        // TODO do we need to store a copy of the config? for the memories?

    }

    /**
     * Returns an object with minScale and maxScale values for the feature class.
     *
     * @function getScaleSet
     * @returns {Object} scale set for the feature class
     */
    getScaleSet () {
        // basic case - we get it from the esri layer
        // TODO need to test for missing layer??
        const l = this._parent._layer;
        return {
            minScale: l.minScale,
            maxScale: l.maxScale
        };
    }

    /**
     * Indicates if the feature class is not visible at the given scale,
     * and if so, if we need to zoom in to see it or zoom out
     *
     * @function isOffScale
     * @param {Integer}  mapScale the scale to test against
     * @returns {Object} has boolean properties `offScale` and `zoomIn`
     */
    isOffScale (mapScale) {
        const scaleSet = this.getScaleSet();

        // GIS for dummies.
        // scale increases as you zoom out, decreases as you zoom in
        // minScale means if you zoom out beyond this number, hide the layer
        // maxScale means if you zoom in past this number, hide the layer
        // 0 value for min or max scale means there is no hiding in effect
        const result = {
            offScale: false,
            zoomIn: false
        };

        // check if out of scale and set zoom direction to scaleSet
        if (mapScale < scaleSet.maxScale && scaleSet.maxScale !== 0) {
            result.offScale = true;
            result.zoomIn = false;
        } else if (mapScale > scaleSet.minScale && scaleSet.minScale !== 0) {
            result.offScale = true;
            result.zoomIn = true;
        }

        return result;
    }

    /**
     * Returns the visibility of the feature class.
     *
     * @function getVisibility
     * @returns {Boolean} visibility of the feature class
     */
    getVisibility () {
        return this._parent._layer.visible;
    }

    /**
     * Applies visibility to feature class.
     *
     * @function setVisibility
     * @param {Boolean} value the new visibility setting
     */
    setVisibility (value) {
        // basic case - set layer visibility
        this._parent._layer.setVisibility(value);
    }

    /**
     * Download or refresh the internal symbology for the FC.
     * mergeAllLayers indicates we should collate entire parent legend into one block.
     * E.g. for basemap tile. the FC index would be 0, but we want all indexes
     *
     * @function loadSymbology
     * @param {Boolean}     mergeAllLayers take entire service legend, no just legend for this FC. Defaults to false.
     * @returns {Promise}   resolves when symbology has been downloaded
     */
    loadSymbology (mergeAllLayers = false) {
        // get symbology from service legend.
        // this is used for non-feature based sources (tiles, image, raster).
        // wms will override with own special logic.
        const url = this._parent._layer.url;
        if (url) {
            // fetch legend from server, convert to local format, process local format
            const legendIndex = mergeAllLayers ? undefined : this._idx;
            return this._parent._apiRef.symbology.mapServerToLocalLegend(url, legendIndex)
                .then(legendData => {
                    this.symbology = shared.makeSymbologyArray(legendData.layers[0].legend);
                });
        } else {
            // this shouldn't happen. non-url layers should be files, which are features,
            // which will have a basic renderer and will use FeatureFC override.
            throw new Error('encountered layer with no renderer and no url');
        }
    }

    /**
     * Zoom to the boundary of the FC.
     * @param {Object} map  esriMap object we want to execute the zoom on
     * @return {Promise} resolves when map is done zooming
     */
    zoomToBoundary (map) {
        return map.zoomToExtent(this.extent);
    }

    /**
     * Zoom to a valid scale level for this layer.
     *
     * @function zoomToScale
     * @param {Object} map                   the map object
     * @param {Array} lods                   level of details array for basemap
     * @param {Boolean} zoomIn               the zoom to scale direction; true need to zoom in; false need to zoom out
     * @param {Boolean} positionOverLayer    ensures the map is over the layer's extent after zooming. only applied if zoomIn is true. defaults to true
     * @returns {Promise}                    promise that resolves after map finishes moving about
     */
    zoomToScale (map, lods, zoomIn, positionOverLayer = true) {
        // get scale set from child, then execute zoom
        const scaleSet = this.getScaleSet();
        return this._parent._zoomToScaleSet(map, lods, zoomIn, scaleSet, positionOverLayer);
    }

    /**
     * Indicate the data source of this FC (e.g. ESRI server, file, WFS, WMS)
     *
     * @function dataSource
     * @returns {String}        The source of the feature class. Will be a member of the shared.dataSources enum
     */
    dataSource () {
        return this._parent.dataSource();
    }

    applyFilterToLayer () {
        throw new Error('Cannot apply filters to non-attribute layers');
    }

    getFilterOIDs () {
        throw new Error('Cannot get OIDs for non-attribute layers');
    }

}

module.exports = () => ({
    BasicFC
});
