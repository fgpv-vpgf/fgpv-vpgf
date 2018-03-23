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
            color: [0, 0, 0],
            width: 1,
            type: 'esriSLS',
            style: 'esriSLSSolid'
        }
    },
    MULTIPOINT: {
        width: 16.5,
        height: 16.5,
        type: 'esriSMS',
        color: [0, 255, 0],
        outline: {
            color: [0, 0, 0],
            width: 1,
            type: 'esriSLS',
            style: 'esriSLSSolid'
        }
    },
    LINESTRING: {
        width: 2,
        type: 'esriSLS',
        color: [255, 0, 0],
        style:' esriSLSSolid',
        outline: {
            color: [0, 0, 0],
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
     * TODO: add identify functionality and fix any other features that might need to be modified
     * @param {Object} esriBundle       bundle of API classes
     * @param {Object} apiRef           object pointing to the geoApi. allows us to call other geoApi functions.
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
                target: e.target,
                graphic: e.graphic
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
            const id = geometry.id;
            if (geometry.type === geometryTypes.POINT) {
                const coords = geometry.xy.projectToPoint(spatialReference);
                const icon = geometry.icon;
                this._addPoint(coords, spatialReference, icon, id);
            } else if (geometry.type === geometryTypes.MULTIPOINT) {
                const coords = geometry.pointArray.map(point => point.xy.projectToPoint(spatialReference))
                const points = coords.map(point => [ point.x, point.y ]);
                const icon = geometry.icon;
                this._addMultiPoint(points, spatialReference, icon, id);
            } else if (geometry.type === geometryTypes.LINESTRING) {
                const coords = geometry.pointArray.map(point => point.xy.projectToPoint(spatialReference))
                const path = coords.map(point => [ point.x, point.y ]);
                this._addLine(path, spatialReference, id);
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
     * @param {String} icon                      data / image url or svg path for layer icon. defaults to a red point
     * @param {String} id                        id of api geometry being added to map
     */
    _addPoint(coords, spatialReference, icon, id) {
        const point = new this._bundle.Point({
            x: coords.x,
            y: coords.y,
            spatialReference: spatialReference
        });

        let symbol, marker;
        if (icon) {
            if (this._isUrl(icon)) {
                // TODO: discuss how to handle the width / height issue when passing in an icon
                symbol = new this._bundle.PictureMarkerSymbol(icon, 16.5, 16.5);
            } else {
                symbol = new this._bundle.SimpleMarkerSymbol();
                symbol.setPath(icon);
                symbol.setColor([255, 0, 0]);
                symbol.setSize('auto');
            }
            marker = new this._bundle.Graphic(point, symbol);
        } else {
            marker = new this._bundle.Graphic({ symbol: defaultSymbols.POINT });
            marker.setGeometry(point);
        }

        marker.geometry.apiId = id;
        this._layer.add(marker);
    }

    /**
     * Add multiple points where specified using the longitutes and latitutes.
     *
     * @function _addMultiPoint
     * @private
     * @param {Array} coords                     an array of long and lat to use as the graphic location for each point
     * @param {Object} spatialReference          the projection the graphics should be in
     * @param {String} icon                      data / image url or svg path for layer icon. defaults to a green point
     * @param {String} id                        id of api geometry being added to map
     */
    _addMultiPoint(coords, spatialReference, icon, id) {
        const points = new this._bundle.Multipoint({
            points: coords,
            spatialReference: spatialReference
        });

        let symbol, marker;
        if (icon) {
            if (this._isUrl(icon)) {
                // TODO: discuss how to handle the width / height issue when passing in an icon
                symbol = new this._bundle.PictureMarkerSymbol(icon, 16.5, 16.5);
            } else {
                symbol = new this._bundle.SimpleMarkerSymbol();
                symbol.setPath(icon);
                symbol.setColor([255, 0, 0]);
                symbol.setSize('auto');
            }
            marker = new this._bundle.Graphic(points, symbol);
        } else {
            marker = new this._bundle.Graphic({ symbol: defaultSymbols.MULTIPOINT });
            marker.setGeometry(points);
        }

        marker.geometry.apiId = id;
        this._layer.add(marker);
    }

    /**
     * Add a line where specified using the path of longitutes and latitutes.
     *
     * @function _addLine
     * @private
     * @param {Array} path                       an array of long and lat to use as the path for the line
     * @param {Object} spatialReference          the projection the graphics should be in
     * @param {String} id                        id of api geometry being added to map
     */
    _addLine(path, spatialReference, id) {
        const line = new this._bundle.Polyline({
            paths: [ path ],
            spatialReference: spatialReference
        });

        const marker = new this._bundle.Graphic({ symbol: defaultSymbols.LINESTRING });
        marker.setGeometry(line);

        marker.geometry.apiId = id;
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

    /**
     * Check to see if text provided is a valid image / data URL based on extension type or format.
     *
     * @function _isUrl
     * @private
     * @param {String} text                      string to be matched against valid image types / data url format
     * @returns {Boolean}                        true if valid image extension
     */
    _isUrl(text) {
        return !!text.match(/\.(jpeg|jpg|gif|png|swf|svg)$/) ||
            !!text.match(/^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i);
    }

    /**
     * Return the extent of an array of graphics.
     *
     * @function getGraphicsBoundingBox
     * @param {Array<Graphic>} graphics      the graphics whose bounding box we want to calculate
     * @returns {Object}                     the extent of an array of graphics
     */
    getGraphicsBoundingBox(graphics) {
        return this._apiRef.proj.graphicsUtils.graphicsExtent(graphics);
    };
}

module.exports = () => ({
    GraphicsRecord
});
