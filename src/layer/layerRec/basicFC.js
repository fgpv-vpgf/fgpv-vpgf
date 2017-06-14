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

    // returns an object with minScale and maxScale values for the feature class
    getScaleSet () {
        // basic case - we get it from the esri layer
        // TODO need to test for missing layer??
        const l = this._parent._layer;
        return {
            minScale: l.minScale,
            maxScale: l.maxScale
        };
    }

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

    // TODO docs
    getVisibility () {
        return this._parent._layer.visible;
    }

    // TODO docs
    setVisibility (value) {
        // basic case - set layer visibility
        this._parent._layer.setVisibility(value);
    }

    // this will actively download / refresh the internal symbology
    // mergeAllLayers indicates we should collate entire parent legend into one block
    //                e.g. for basemap tile. this._idx would have value 0, but we want all indexes
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

    zoomToBoundary (map) {
        return map.zoomToExtent(this.extent);
    }

}

module.exports = () => ({
    BasicFC
});
