'use strict';

const layerInterface = require('./layerInterface.js')();
const shared = require('./shared.js')();
const root = require('./root.js')();

/**
 * @class LayerRecord
 */
class LayerRecord extends root.Root {
    // NOTE: we used to override layerClass in each specific class.
    //       since we require the class in the generic constructor,
    //       and since it was requested that the esri class be passed in
    //       as a constructor parameter instead of holding a ref to the esriBundle,
    //       and since you must call `super` first in a constructor,
    //       it was impossible to assign the specific class before the generic
    //       constructor executed, resulting in null-dereferences.
    //       this approach solves the problem.
    get layerClass () { return this._layerClass; }
    get config () { return this.initialConfig; } // TODO: add a live config reference if needed
    get legendEntry () { return this._legendEntry; } // legend entry class corresponding to those defined in legend entry service
    set legendEntry (value) { this._legendEntry = value; } // TODO: determine if we still link legends inside this class
    get state () { return this._state; }
    set state (value) { this._state = value; }
    get layerId () { return this.config.id; }

    // TODO should probably remove passthrough bindings?
    get _layerPassthroughBindings () { return ['setOpacity', 'setVisibility']; } // TODO when jshint parses instance fields properly we can change this from a property to a field
    get _layerPassthroughProperties () { return ['visibleAtMapScale', 'visible', 'spatialReference']; } // TODO when jshint parses instance fields properly we can change this from a property to a field
    get userLayer () { return this._user; } // indicates if layer was added by a user
    set userLayer (value) { this._user = value; }

    get visibility () {
        if (this._layer) {
            return this._layer.visible;
        } else {
            return true; // TODO what should a proper default be? example of this situation??
        }
    }
    set visibility (value) {
        if (this._layer) {
            this._layer.setVisibility(value);
        }

        // TODO do we need an ELSE case here?
    }

    get opacity () {
        if (this._layer) {
            return this._layer.opacity;
        } else {
            return 1; // TODO what should a proper default be? example of this situation??
        }
    }
    set opacity (value) {
        if (this._layer) {
            this._layer.setOpacity(value);
        }

        // TODO do we need an ELSE case here?
    }

    /**
     * Attach event handlers to layer events
     */
    bindEvents (layer) {
        // TODO optional refactor.  Rather than making the events object in the parameter,
        //      do it as a variable, and only add mouse-over, mouse-out events if we are
        //      in an app configuration that will use it. May save a bit of processing
        //      by not having unused events being handled and ignored.
        //      Second optional thing. Call a separate wrapEvents in FeatuerRecord class
        // TODO apply johann update here
        this._apiRef.events.wrapEvents(layer, {
            // wrapping the function calls to keep `this` bound correctly
            load: () => this.onLoad(),
            error: e => this.onError(e),
            'update-start': () => this.onUpdateStart(),
            'update-end': () => this.onUpdateEnd(),
            'mouse-over': e => this.onMouseOver(e),
            'mouse-out': e => this.onMouseOut(e)
        });
    }

    /**
     * Perform layer initialization tasks
     */
    constructLayer () {
        this._layer = this.layerClass(this.config.url, this.makeLayerConfig());
        this.bindEvents(this._layer);
        return this._layer;
    }

    /**
     * Handle a change in layer state
     */
    _stateChange (newState) {
        this._state = newState;
        console.log(`State change for ${this.layerId} to ${newState}`);

        // if we don't copy the array we could be looping on an array
        // that is being modified as it is being read
        this._fireEvent(this._stateListeners, this._state);
    }

    /**
     * Wire up state change listener
     */
    addStateListener (listenerCallback) {
        this._stateListeners.push(listenerCallback);
        return listenerCallback;
    }

    /**
     * Remove a state change listener
     */
    removeStateListener (listenerCallback) {
        const idx = this._stateListeners.indexOf(listenerCallback);
        if (idx < 0) {
            throw new Error('Attempting to remove a listener which is not registered.');
        }
        this._stateListeners.splice(idx, 1);
    }

    /**
     * Wire up mouse hover listener
     */
    addHoverListener (listenerCallback) {
        this._hoverListeners.push(listenerCallback);
        return listenerCallback;
    }

    /**
     * Remove a mouse hover listener
     */
    removeHoverListener (listenerCallback) {
        const idx = this._hoverListeners.indexOf(listenerCallback);
        if (idx < 0) {
            throw new Error('Attempting to remove a listener which is not registered.');
        }
        this._hoverListeners.splice(idx, 1);
    }

    /**
    * Triggers when the layer loads.
    * Returns an array of promises that need to resolve for layer to be loaded.
    *
    * @function onLoad
    */
    onLoad () {
        // only super-general stuff in here, that all layers should run.
        console.info(`Layer loaded: ${this._layer.id}`);

        if (!this.name) {
            // no name from config. attempt layer name
            this.name = this._layer.name;
        }

        if (!this.extent) {
            // no extent from config. attempt layer extent
            this.extent = this._layer.fullExtent;
        }

        let lookupPromise = Promise.resolve();
        if (this._epsgLookup) {
            const check = this._apiRef.proj.checkProj(this.spatialReference, this._epsgLookup);
            if (check.lookupPromise) {
                lookupPromise = check.lookupPromise;
            }

            // TODO if we don't find a projection, the app will show the layer loading forever.
            //      might need to handle the fail case and show something to the user.
        }
        return [lookupPromise];
    }

    /**
     * Handles when the layer has an error
     */
    onError (e) {
        console.warn(`Layer error: ${e}`);
        console.warn(e);
        this._stateChange(shared.states.ERROR);
    }

    /**
     * Handles when the layer starts to update
     */
    onUpdateStart () {
        this._stateChange(shared.states.REFRESH);
    }

    /**
     * Handles when the layer finishes updating
     */
    onUpdateEnd () {
        this._stateChange(shared.states.LOADED);
    }

    /**
     * Handles when the mouse enters a layer
     */
    onMouseOver () {
        // do nothing in baseclass
    }

    /**
     * Handles when the mouse leaves a layer
     */
    onMouseOut () {
        // do nothing in baseclass
    }

    /**
     * Creates an options object for the physical layer
     */
    makeLayerConfig () {
        return {
            id: this.config.id,
            opacity: this.config.state.opacity,
            visible: this.config.state.visibility
        };
    }

    /**
     * Figure out visibility scale.  Will use layer minScale/maxScale
     * and map levels of detail to determine scale boundaries.
     *
     * @param {Array} lods            array of valid levels of detail for the map
     * @param {Object} scaleSet       contains .minScale and .maxScale for valid viewing scales
     * @param {Boolean} zoomIn        the zoom to scale direction; true need to zoom in; false need to zoom out
     * @param {Boolean} zoomGraphic   an optional value when zoomToScale is use to zoom to a graphic element;
     *                                    true used to zoom to a graphic element; false not used to zoom to a graphic element
     * @returns {Object} a level of detail (lod) object for the appropriate scale to zoom to
     */
    findZoomScale (lods, scaleSet, zoomIn, zoomGraphic = false) {
        // TODO rename function to getZoomScale?
        // TODO take a second look at parameters zoomIn and zoomGraphic. how are they derived (in the caller code)?
        //      seems weird to me to do it this way
        // TODO naming of "zoomIn" is very misleading and confusing. in practice, we are often
        //      setting the value to false when we are zooming down close to the ground.
        //      Need full analysis of usage, possibly rename parameter or update param docs.
        // TODO update function parameters once things are working

        // if the function is used to zoom to a graphic element and the layer is out of scale we always want
        // the layer to zoom to the maximum scale allowed for the layer. In this case, zoomIn must be
        // always false

        zoomIn = (zoomGraphic) ? false : zoomIn;

        // TODO double-check where lods are coming from in old code
        // change search order of lods depending if we are zooming in or out
        const modLods = zoomIn ? lods : [...lods].reverse();

        return modLods.find(currentLod => zoomIn ? currentLod.scale < scaleSet.minScale :
                currentLod.scale > scaleSet.maxScale);
    }

    /**
    * Set map scale depending on zooming in or zooming out of layer visibility scale
    *
    * @param {Object} map layer to zoom to scale to for feature layers; parent layer for dynamic layers
    * @param {Object} lod scale object the map will be set to
    * @param {Boolean} zoomIn the zoom to scale direction; true need to zoom in; false need to zoom out
    * @returns {Promise} resolves after map is done changing its extent
    */
    setMapScale (map, lod, zoomIn) {
        // TODO possible this would live in the map manager in a bigger refactor.
        // NOTE because we utilize the layer object's full extent (and not child feature class extents),
        //      this function stays in this class.

        // if zoom in is needed; must find center of layer's full extent and perform center&zoom
        if (zoomIn) {
            // need to reproject in case full extent in a different sr than basemap
            const gextent = this._apiRef.proj.localProjectExtent(this._layer.fullExtent, map.spatialReference);

            const reprojLayerFullExt = this._apiRef.Map.Extent(gextent.x0, gextent.y0,
                gextent.x1, gextent.y1, gextent.sr);

            // check if current map extent already in layer extent
            return map.setScale(lod.scale).then(() => {
                // if map extent not in layer extent, zoom to center of layer extent
                // don't need to return Deferred otherwise because setScale already resolved here
                if (!reprojLayerFullExt.intersects(map.extent)) {
                    return map.centerAt(reprojLayerFullExt.getCenter());
                }
            });
        } else {
            return map.setScale(lod.scale);
        }
    }

    /**
     * Figure out visibility scale and zoom to it.  Will use layer minScale/maxScale
     * and map levels of detail to determine scale boundaries.
     *
     * @private
     * @param {Object} map            the map object
     * @param {Array} lods            level of details array for basemap
     * @param {Boolean} zoomIn        the zoom to scale direction; true need to zoom in; false need to zoom out
     * @param {Object} scaleSet       contains min and max scales for the layer.
     * @param {Boolean} zoomGraphic   an optional value when zoomToScale is use to zoom to a graphic element;
     *                                    true used to zoom to a graphic element; false not used to zoom to a graphic element
     */
    _zoomToScaleSet (map, lods, zoomIn, scaleSet, zoomGraphic = false) {
        // TODO update function parameters once things are working

        // if the function is used to zoom to a graphic element and the layer is out of scale we always want
        // the layer to zoom to the maximum scale allowed for the layer. In this case, zoomIn must be
        // always false
        zoomIn = (zoomGraphic) ? false : zoomIn;

        // NOTE we use lods provided by config rather that system-ish map.__tileInfo.lods
        const zoomLod = this.findZoomScale(lods, scaleSet, zoomIn, zoomGraphic = false);

        // TODO ponder on the implementation of this
        return this.setMapScale(this._layer, zoomLod, zoomIn);

    }

    // TODO docs
    zoomToScale (map, lods, zoomIn, zoomGraphic = false) {
        // get scale set from child, then execute zoom
        const scaleSet = this._featClasses[this._defaultFC].getScaleSet();
        return this._zoomToScaleSet(map, lods, zoomIn, scaleSet, zoomGraphic);
    }

    // TODO docs
    isOffScale (mapScale) {
        return this._featClasses[this._defaultFC].isOffScale(mapScale);
    }

    /**
    * Zoom to layer boundary of the layer specified by layerId
    * @param {Object} map  map object we want to execute the zoom on
    * @return {Promise} resolves when map is done zooming
    */
    zoomToBoundary (map) {
        return this.zoomToExtent(map, this.extent);
    }

    /**
     * Worker function to zoom the map to an extent of possibly
     * @param {Object} map        map object we want to execute the zoom on
     * @param {Object} extent     map object we want to execute the zoom on
     * @private
     * @return {Promise} resolves when map is done zooming
     */
    zoomToExtent (map, extent) {
        // TODO add some caching? make sure it will get wiped if we end up changing projections
        //      or use wkid as caching key?
        //      trickyier now that we are in shared function.
        //      maybe return an object {promise, projected extent}, and caller can cache it?

        const projRawExtent = this._apiRef.proj.localProjectExtent(extent, map.spatialReference);

        const projFancyExtent = this._apiRef.Map.Extent(projRawExtent.x0, projRawExtent.y0,
            projRawExtent.x1, projRawExtent.y1, projRawExtent.sr);

        return map.setExtent(projFancyExtent);
    }

    /**
    * Returns the visible scale values of the layer
    * @returns {Object} has properties .minScale and .maxScale
    */
    getVisibleScales () {
        // default layer, take from layer object
        // TODO do we need to handle a missing layer case?
        //      no one should be calling this until layer is loaded anyways
        return {
            minScale: this._layer.minScale,
            maxScale: this._layer.maxScale
        };
    }

    /**
    * Returns the feature count
    * @returns {Promise} resolves feature count
    */
    getFeatureCount () {
        // TODO determine best result to indicate that layer does not have features
        //      we may want a null so that UI can display a different message (or suppress the message).
        //      of note, the proxy is currently returning undefined for non-feature things
        return Promise.resolve(0);
    }

    /**
     * Create an extent centered around a point, that is appropriate for the current map scale.
     * @param {Object} point       point on the map for extent center
     * @param {Object} map         map object the extent is relevant for
     * @param {Integer} tolerance  optional. distance in pixels from mouse point that qualifies as a hit. default is 5
     * @return {Object} an extent of desired size and location
     */
    makeClickBuffer (point, map, tolerance = 5) {
        // take pixel tolerance, convert to map units at current scale. x2 to turn radius into diameter
        const buffSize = 2 * tolerance * map.extent.getWidth() / map.width;

        // Build tolerance envelope of correct size
        const cBuff = new this._apiRef.Map.Extent(0, 0, buffSize, buffSize, point.spatialReference);

        // move the envelope so it is centered around the point
        return cBuff.centerAt(point);
    }

    // TODO docs
    get symbology () { return this._featClasses[this._defaultFC].symbology; }

    // TODO docs
    isQueryable () {
        return this._featClasses[this._defaultFC].queryable;
    }

    // TODO docs
    setQueryable (value) {
        this._featClasses[this._defaultFC].queryable = value;
    }

    getGeomType () {
        // standard case, layer has no geometry. This gets overridden in feature-based Record classes.
        return undefined;
    }

    // returns the proxy interface object for the root of the layer (i.e. main entry in legend, not nested child things)
    // TODO docs
    getProxy () {
        // NOTE baseclass used by things like WMSRecord, ImageRecord, TileRecord
        if (!this._rootProxy) {
            this._rootProxy = new layerInterface.LayerInterface(this, this.initialConfig.controls);
            this._rootProxy.convertToSingleLayer(this);
        }
        return this._rootProxy;
    }

    /**
     * Create a layer record with the appropriate geoApi layer type.  Layer config
     * should be fully merged with all layer options defined (i.e. this constructor
     * will not apply any defaults).
     * @param {Object} layerClass    the ESRI api object for the layer
     * @param {Object} apiRef        object pointing to the geoApi. allows us to call other geoApi functions.
     * @param {Object} config        layer config values
     * @param {Object} esriLayer     an optional pre-constructed layer
     * @param {Function} epsgLookup  an optional lookup function for EPSG codes (see geoService for signature)
     */
    constructor (layerClass, apiRef, config, esriLayer, epsgLookup) {
        super();
        this._layerClass = layerClass;
        this.name = config.name || '';
        this._featClasses = {};
        this._defaultFC = '0';
        this._apiRef = apiRef;
        this.initialConfig = config;
        this._stateListeners = [];
        this._hoverListeners = [];
        this._user = false;
        this._epsgLookup = epsgLookup;
        this.extent = config.extent; // if missing, will fill more values after layer loads

        // TODO verify we still use passthrough bindings.
        this._layerPassthroughBindings.forEach(bindingName =>
            this[bindingName] = (...args) => this._layer[bindingName](...args));
        this._layerPassthroughProperties.forEach(propName => {
            const descriptor = {
                enumerable: true,
                get: () => this._layer[propName]
            };
            Object.defineProperty(this, propName, descriptor);
        });

        if (esriLayer) {
            this.constructLayer = () => { throw new Error('Cannot construct pre-made layers'); };
            this._layer = esriLayer;
            this.bindEvents(this._layer);

            // TODO might want to change this to be whatever layer says it is
            this._state = shared.states.LOADING;
            if (!this.name) {
                // no name from config. attempt layer name
                this.name = esriLayer.name;
            }

            if (!esriLayer.url) {
                // file layer. force snapshot, force an onload
                this._snapshot = true;
                this.onLoad();
            }

        } else {
            this.constructLayer(config);
            this._state = shared.states.LOADING;
        }
    }
}

module.exports = () => ({
    LayerRecord
});
