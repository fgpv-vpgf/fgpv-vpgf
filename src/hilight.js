'use strict';

// contains functions to support the hilight layer.

function cloneBuilder(esriBundle) {
    /**
    * Clone a graphic from a map-bound layer.
    * @method cloneLayerGraphic
    * @param {Graphic} graphic an ESRI graphic that resides in a map layer.
    * @return {Object} an unbound copy of the graphic
    */
    return graphic => {
        const clone = new esriBundle.Graphic({
                geometry: graphic.geometry
            });
        clone.symbol = graphic.getLayer().renderer.getSymbol(graphic);
        return clone;
    };
}

function graphicBuilder(esriBundle) {
    /**
    * Generating a graphic from server geometry.
    * @method geomToGraphic
    * @param {Object} geometry feature geometry conforming to ESRI Geometry standard
    * @param {Object} symbol esri symbol in server format
    * @return {Object} an ESRI GraphicsLayer
    */
    return (geometry, symbol) => {
        const graphic = new esriBundle.Graphic({
                geometry
            });
        graphic.symbol = esriBundle.symbolJsonUtils.fromJson(symbol);
        return graphic;
    };
}

function hilightBuilder(esriBundle) {
    /**
    * Generate a graphic layer to handle feature hilighting.
    * @method makeHilightLayer
    * @param {Object} options optional settings for the hilight layer
    *                         layerId - id to use for the hilight layer. defaults to rv_hilight
    *                         pinSymbol - esri symbol in server json format to symbolize the click marker. defaults to a red pin
    *                         hazeOpacity -  how opaque the haze sheet behind the hilight is. 0 to 255, 0 being transparent. defaults to 110
    * @return {Object} an ESRI GraphicsLayer
    */
    return options => {
        // set options
        let id = 'rv_hilight';
        let hazeOpac = 110;
        let pinSymbol = {
            color: [230, 0, 0, 175],
            size: 12,
            yoffset: 6,
            type: 'esriSMS',
            style: 'esriSMSPath',
            outline: {
                color: [0, 0, 0, 255],
                width: 1,
                type: 'esriSLS',
                style: 'esriSLSSolid'
            },
            /* jscs:disable maximumLineLength */
            path: 'M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z'
            /* jscs:enable maximumLineLength */
        };

        if (options) {
            if (options.layerId) {
                id = options.layerId;
            }
            if (options.pinSymbol) {
                pinSymbol = options.pinSymbol;
            }
            if (options.hazeOpacity) {
                hazeOpac = options.hazeOpacity;
            }
        }

        const hgl = new esriBundle.GraphicsLayer({ id, visible: true });

        // ensure highlight is top-most graphic layer
        function moveHilightToTop() {
            hgl._map.reorderLayer(hgl, hgl._map.graphicsLayerIds.length);
        }

        /**
        * Add a graphic to indicate where user clicked.
        * @method addPin
        * @param {Point} point an ESRI point object to use as the graphic location
        */
        hgl.addPin = point => {

            const pin = new esriBundle.Graphic({ symbol: pinSymbol });
            pin.setGeometry(point);

            hgl.add(pin);
            moveHilightToTop();
        };

        /**
        * Add a graphic to the highlight layer. Remove any previous graphic.
        * @method addHilight
        * @param {Graphic} graphic an ESRI graphic. Should be in map spatialReference, and not bound to a layer
        */
        hgl.addHilight = graphic => {

            if (hgl._hilightGraphic) {
                // if active hilight graphic, remove it
                hgl.remove(hgl._hilightGraphic);
            } else {
                // first application of hilight. add haze background
                const hazeJson = {
                    symbol: {
                        color: [255, 255, 255, hazeOpac],
                        type: 'esriSFS',
                        style: 'esriSFSSolid',
                        outline: {
                            type: 'esriSLS',
                            style: 'esriSLSNull'
                        }
                    }
                };
                const haze = new esriBundle.Graphic(hazeJson);
                haze.setGeometry(hgl._map.extent.expand(1.5)); // expand to avoid edges on quick pan
                haze.haze = true;  // notifies layer to put this under any hilight graphics
                hgl.add(haze);
            }

            // add new hilight graphic
            hgl._hilightGraphic = graphic;
            hgl.add(graphic);
            moveHilightToTop();
        };

        /**
        * Remove hilight from map
        * @method clearHilight
        */
        hgl.clearHilight = () => {
            // clear tracking vars, wipe the layer
            hgl._hilightGraphic = null;
            hgl.clear();
        };

        hgl.on('graphic-node-add', e => {
            // figure out if graphic needs to be at top or bottom of hilight layer
            const g = e.graphic;
            const dojoShape = g.getShape();
            if (dojoShape) {
                if (g.haze) {
                    dojoShape.moveToBack();
                } else {
                    dojoShape.moveToFront();
                }
            }
        });

        return hgl;
    };
}

module.exports = (esriBundle) => ({
    makeHilightLayer: hilightBuilder(esriBundle),
    geomToGraphic: graphicBuilder(esriBundle),
    cloneLayerGraphic: cloneBuilder(esriBundle)
});
