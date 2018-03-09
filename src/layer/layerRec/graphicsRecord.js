'use strict';

const layerInterface = require('./layerInterface.js')();
const root = require('./root.js')();
const shared = require('./shared.js')();

const geometryTypes = {
    POINT: 'Point',
    MULTIPOINT: 'MultiPoint',
    LINESTRING: 'LineString',
    MULTILINESTRING: 'MultiLineString'
}

const defaultSymbols = {
    POINT: {
        width: 16.5,
        height: 16.5,
        type: 'esriSMS',
        color: [255, 0, 0],
        outline: {
            color: [0,0,0],
            width: 1,
            type: 'esriSLS',
            style: 'esriSLSSolid'
        }
    }
}

/**
 * @class GraphicsRecord
 */
class GraphicsRecord extends root.Root {
    /**
     * Create a graphics layer record with the appropriate geoApi layer type.
     * TODO: possibly have an intermediate class between root and layerRecord to have all the duplicated items, such as hovertips.
     * TODO: add identify functionality and fix up hover listeners / other features that might need to be modified
     * @param {Object} esriBundle       bundle of API classes
     * @param {Object} apiRef        object pointing to the geoApi. allows us to call other geoApi functions.
     * @param {String} name             name and id of the layer.
     */
    constructor (esriBundle, apiRef, name) {
        super();

        this._bundle = esriBundle;
        this._apiRef = apiRef;
        this._layerClass = esriBundle.GraphicsLayer;
        this._name = name;
        this._id = name;
        this._layer = this._layerClass({ id: this._name });
        this.bindEvents(this._layer);
        this._hoverListeners = [];
    }

    get layerId () { return this._id; }

    get name () { return this._name; }
    set name (value) {
        this._name = value;
        this._id = value;
    }

    get layerType () { return shared.clientLayerType.ESRI_GRAPHICS; }

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
     * Attach record event handlers to common layer events
     *
     * @function bindEvents
     * @param {Object} layer the api layer object
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
            'mouse-over': e => this.onMouseOver(e),
            'mouse-out': e => this.onMouseOut(e)
        });
    }

    /**
     * Wire up mouse hover listener.
     *
     * @function addHoverListener
     * @param {Function} listenerCallback function to call when a hover event happens
     */
    addHoverListener (listenerCallback) {
        this._hoverListeners.push(listenerCallback);
        return listenerCallback;
    }

    /**
     * Remove a mouse hover listener.
     *
     * @function removeHoverListener
     * @param {Function} listenerCallback function to not call when a hover event happens
     */
    removeHoverListener (listenerCallback) {
        const idx = this._hoverListeners.indexOf(listenerCallback);
        if (idx < 0) {
            throw new Error('Attempting to remove a listener which is not registered.');
        }
        this._hoverListeners.splice(idx, 1);
    }

    /**
     * Provides the proxy interface object to the layer.
     *
     * @function getProxy
     * @returns {Object} the proxy interface for the layer
     */
    getProxy () {
        if (!this._rootProxy) {
            this._rootProxy = new layerInterface.LayerInterface(this);
            this._rootProxy.convertToGraphicsLayer(this);
        }
        return this._rootProxy;
    }

    /**
     * Triggers when the mouse enters a feature of the layer.
     *
     * @function onMouseOver
     * @param {Object} standard mouse event object
     */
    onMouseOver (e) {
        if (this._hoverListeners.length > 0) {

            const showBundle = {
                type: 'mouseOver',
                point: e.screenPoint,
                target: e.target
            };

            // tell anyone listening we moused into something
            this._fireEvent(this._hoverListeners, showBundle);
        }
    }

    /**
     * Triggers when the mouse leaves a feature of the layer.
     *
     * @function onMouseOut
     * @param {Object} standard mouse event object
     */
    onMouseOut (e) {
        // tell anyone listening we moused out
        const outBundle = {
            type: 'mouseOut',
            target: e.target
        };
        this._fireEvent(this._hoverListeners, outBundle);
    }

    /**
     * Identify the type of geometry being added and add it to the map.
     *
     * @function addGeometry
     * @param {Object|Array} geo                  api geometry class to be added
     * @param {Object} spatialReference          the projection the graphics should be in
     */
    addGeometry(geo, spatialReference) {
        const geometries = Array.isArray(geo) ? geo : [ geo ];

        geometries.forEach(geometry => {
            if (geometry.type === geometryTypes.POINT) {
                const coords = geometry.xy.projectToPoint(spatialReference);
                const icon = geometry.icon;
                this._addPoint(coords, spatialReference, icon);
            }

            // TODO: add 'private' functions and conditions for other geometry types as well
        });
    }

    /**
     * Add a point where specified using longitute and latitute.
     *
     * @function _addPoint
     * @private
     * @param {Object} coords                    the long and lat to use as the graphic location
     * @param {Object} spatialReference          the projection the graphics should be in
     * @param {String} icon                      data url to for layer icon. defaults to a red point
     */
    _addPoint(coords, spatialReference, icon) {
        const point = new this._bundle.Point({
            x: coords.x,
            y: coords.y,
            spatialReference: spatialReference
        });

        let symbol;
        if (icon) {
            // TODO: discuss how to handle the width / height issue when passing in an icon
            symbol = {
                width: 16.5,
                height: 16.5,
                type: 'esriPMS',
                contentType: 'image/png',
                url: icon
            };
        }

        const marker = new this._bundle.Graphic({ symbol: symbol || defaultSymbols.POINT });
        marker.setGeometry(point);
        this._layer.add(marker);
    }

    /**
    * Remove the specified graphic.
    *
    * @function removeGeometry
    * @param {Number} index      index of the graphic to remove from the layer
    */
    removeGeometry(index) {
        const graphic = this._layer.graphics[index];
        this._layer.remove(graphic);
    };
}

module.exports = () => ({
    GraphicsRecord
});
