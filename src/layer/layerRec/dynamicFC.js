'use strict';

const attribFC = require('./attribFC.js')();

/**
 * @class DynamicFC
 */
class DynamicFC extends attribFC.AttribFC {
    // dynamic child variant for feature class object.
    // deals with stuff specific to dynamic children (i.e. virtual layer on client)

    /**
     * Create an feature class object for a feature class that is a child of a dynamic layer
     * @param {Object} parent        the Record object that this Feature Class belongs to
     * @param {String} idx           the service index of this Feature Class. an integer in string format. use '0' for non-indexed sources.
     * @param {Object} layerPackage  a layer package object from the attribute module for this feature class
     * @param {Object} config        the config object for this sublayer
     */
    constructor (parent, idx, layerPackage, config) {
        super(parent, idx, layerPackage, config);

        this.opacity = config.state.opacity;

        // visibility is kept stateful by the parent. keeping an internal property
        // just means we would need to keep it in synch.
        // the DynamicRecord onLoad handler will set the initial state, so don't do it here.
    }

    get supportsOpacity () { return this._parent._isTrueDynamic; }

    get opacity () { return this._opacity; }
    set opacity (value) {
        // avoid parent/child update loops by only doing work if value changed
        if (this._opacity !== value) {
            this._opacity = value;

            if (this.supportsOpacity) {
                // only attempt to set the layer if we support that kind of magic.
                // instead of being consistent, esri using value from 0 to 100 for sublayer transparency where 100 is fully transparent
                const optionsArray = [];
                const drawingOptions = new this._parent._apiRef.layer.LayerDrawingOptions();
                drawingOptions.transparency = (value - 1) * -100;
                optionsArray[this._idx] = drawingOptions;
                this._parent._layer.setLayerDrawingOptions(optionsArray);
            } else {
                // update the opacity on the parent and any sibling children
                this._parent.synchOpacity(value);
            }
        }
    }

    // returns an object with minScale and maxScale values for the feature class
    getScaleSet () {
        // get the layerData promise for this FC, wait for it to load,
        // then return the scale data
        return this.getLayerData().then(lData => {
            return {
                minScale: lData.minScale,
                maxScale: lData.maxScale
            };
        });
    }

    get geomType () { return this._geometryType; }
    set geomType (value) { this._geometryType = value; }

    get featureCount () { return this._fcount; }
    set featureCount (value) { this._fcount = value; }

    setVisibility (value) {
        // update visible layers array
        const vLayers = this._parent._layer.visibleLayers.concat();
        const intIdx = parseInt(this._idx);
        const vIdx = vLayers.indexOf(intIdx);
        let dirty = false;
        let layerVisChange = false;
        if (value && vIdx === -1) {
            // check for first added case
            if (vLayers.length === 1 && vLayers[0] === -1) {
                vLayers.pop();
                layerVisChange = true;
            }

            // was invisible, now visible
            vLayers.push(intIdx);
            dirty = true;
        } else if (!value && vIdx > -1) {
            // was visible, now invisible
            vLayers.splice(vIdx, 1);
            if (vLayers.length === 0) {
                vLayers.push(-1); // code for no layers
                layerVisChange = true;
            }
            dirty = true;
        }

        if (dirty) {
            this._parent._layer.setVisibleLayers(vLayers);
            if (layerVisChange) {
                this._parent._layer.setVisibility(value);
            }
        }

        // TODO add a timer or something to cache requests.
        //      use setVisibileLayers(arry, true) to stall the redraw
        //      then when timer runs out, call layer.refresh

    }

    // TODO extend this function to other FC's?  do they need it?
    getVisibility () {
        return this._parent._layer.visibleLayers.indexOf(parseInt(this._idx)) > -1;
    }

}

module.exports = () => ({
    DynamicFC
});
