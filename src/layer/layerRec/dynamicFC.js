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
        this._highlightFeature = true;

        // visibility is kept stateful by the parent. keeping an internal property
        // just means we would need to keep it in synch.
        // the DynamicRecord onLoad handler will set the initial state, so don't do it here.

        // will also cache scale levels to avoid asynching code.  initialize here with no limits,
        // then update when layer loads
        this._scaleSet = {
            minScale: 0,
            maxScale: 0
        };
    }

    get highlightFeature () { return this._highlightFeature; }
    set highlightFeature (value) { this._highlightFeature = value; }

    get supportsOpacity () { return this._parent._isTrueDynamic; }

    get opacity () { return this._opacity; }
    set opacity (value) {
        // avoid parent/child update loops by only doing work if value changed
        if (this._opacity !== value) {
            this._opacity = value;

            if (this.supportsOpacity) {
                // only attempt to set the layer if we support that kind of magic.
                // instead of being consistent, esri using value from 0 to 100 for sublayer transparency where 100 is fully transparent
                const realLayer = this._parent._layer;
                const optionsArray = realLayer.layerDrawingOptions || [];
                const drawingOptions = optionsArray[this._idx] || new this._parent._apiRef.layer.LayerDrawingOptions();
                drawingOptions.transparency = (value - 1) * -100;
                optionsArray[this._idx] = drawingOptions;
                realLayer.setLayerDrawingOptions(optionsArray);
            } else {
                // update the opacity on the parent and any sibling children
                this._parent.synchOpacity(value);
            }
        }
    }

    /**
     * Returns an object with minScale and maxScale values for the feature class.
     *
     * @function getScaleSet
     * @returns {Object} scale set for the feature class
     */
    getScaleSet () {
        return this._scaleSet;
    }

    get featureCount () { return this._fcount; }
    set featureCount (value) { this._fcount = value; }

    /**
     * Applies visibility to feature class by manipulating the parent record.
     *
     * @function setVisibility
     * @param {Boolean} value the new visibility setting
     */
    setVisibility (value) {
        // update visible layers array
        const eLayer = this._parent._layer;
        const visDelay = this._parent._visDelay;
        const vLayers = eLayer.visibleLayers.concat();
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
            // boolean option will supress the layer from refreshing.
            // useful because if a group visibility was toggled, we will have many children
            // being set at the same time.
            eLayer.setVisibleLayers(vLayers, true);

            visDelay.lastIdx = this._idx; // setting on parent preserves value across children
            if (layerVisChange) {
                // let the timer know it has to adjust the layer visibility
                visDelay.parentToggle = true;
                visDelay.parentValue = value; // we store value to combat super-fast users
            }

            const refreshCheck = () => {
                if (visDelay.lastIdx === this._idx) {
                    // appears no other visibility changes have happened in the delay window.
                    // trigger a layer refresh or change the entire layer visibility
                    if (visDelay.parentToggle) {
                        visDelay.parentToggle = false;
                        eLayer.setVisibility(visDelay.parentValue);
                    } else {
                        eLayer.refresh();
                    }
                }
            };

            setTimeout(refreshCheck, 50);

        }
    }

    /**
     * Returns the visibility of the feature class.
     *
     * @function getVisibility
     * @returns {Boolean} visibility of the feature class
     */
    getVisibility () {
        // TODO extend this function to other FC's?  do they need it?
        return this._parent._layer.visibleLayers.indexOf(parseInt(this._idx)) > -1;
    }

    /**
     * Applies a definition query to the feature class by manipulating the parent record.
     *
     * @function setDefinitionQuery
     * @param {String} query a valid definition query
     */
    setDefinitionQuery (query) {
        const l = this._parent._layer;

        // get layerDefinitions from layer, or init an empty array
        const layerDef = Array.isArray(l.layerDefinitions) ? l.layerDefinitions : [];

        // enhance the array and apply back to the layer
        layerDef[parseInt(this._idx)] = query;
        l.setLayerDefinitions(layerDef);
    }

}

module.exports = () => ({
    DynamicFC
});
