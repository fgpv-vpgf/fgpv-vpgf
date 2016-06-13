'use strict';

// TODO hilight layer would be a good candidate for a custom class which internally proxies to ESRI's GraphicsLayer.

const defaultSymbols = require('./defaultHilightSymbols.json');

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
    *                         hazeOpacity -  how opaque the haze sheet behind the hilight is. 0 to 255, 0 being transparent. defaults to 127
    * @return {Object} an ESRI GraphicsLayer
    */
    return options => {
        // set options
        let id = 'rv_hilight';
        let hazeOpac = 127;
        let pinSymbol = defaultSymbols.pinSymbol;

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
        * Add a graphic or array of graphics to the highlight layer. Remove any previous graphics.
        * @method addHilight
        * @param {Graphic|Array} graphic an ESRI graphic, or array of ESRI graphics. Should be in map spatialReference, and not bound to a layer
        */
        hgl.addHilight = graphic => {

            if (!Array.isArray(graphic)) {
                graphic = [graphic];
            }

            if (hgl._hilightGraphics) {
                // if active hilight graphics, remove them
                hgl._hilightGraphics.forEach(g => hgl.remove(g));
            } else {
                // first application of hilight. add haze background by creating a partially opaque layer for
                // the whole map extent with some buffer. This will go under the highlighted graphic to make it stand out.
                const hazeJson = {
                    symbol: defaultSymbols.hazeSymbol
                };
                hazeJson.symbol.color[3] = hazeOpac;
                const hazeGraphic = new esriBundle.Graphic(hazeJson);
                hazeGraphic.setGeometry(hgl._map.extent.expand(1.5)); // expand to avoid edges on quick pan
                hazeGraphic.haze = true;  // notifies layer to put this under any hilight graphics
                hgl.add(hazeGraphic);
            }

            // add new hilight graphic
            hgl._hilightGraphics = graphic;
            graphic.forEach(g => hgl.add(g));
            moveHilightToTop();
        };

        /**
        * Remove hilight from map
        * @method clearHilight
        */
        hgl.clearHilight = () => {
            // clear tracking vars, wipe the layer
            hgl._hilightGraphics = null;
            hgl.clear();
        };

        hgl.on('graphic-node-add', e => {
            // figure out if graphic needs to be at top or bottom of hilight layer
            // haze polygon goes to bottom, everything else to top
            const g = e.graphic;
            const dojoShape = g.getShape();

            if (g.haze) {
                dojoShape.moveToBack();
            } else {
                dojoShape.moveToFront();
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
