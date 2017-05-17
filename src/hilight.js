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

function getGraphicsBuilder(esriBundle, geoApi) {
    // TODO once document sites are up and running, figure out a way to hyperlink the graphicBundles parameter to the class documentation page in the viewer site
    /**
    * Generating a graphic from server geometry.
    * @method getUnboundGraphics
    * @param {Array} graphicBundles set of graphic bundles with properties .graphic, .source, .layer, .featureIdx.
    * @param {Object} spatialReference the projection the unbound graphics should be in
    * @return {Array} a set of promises that resolve with an unbound graphic, one for each graphic bundle provided
    */
    return (graphicBundles, spatialReference) => {

        // generate detached graphics to give to the hilight layer.
        // promises because server layers renderer is inside a promise
        return graphicBundles.map(bundle => {
            if (bundle.source === 'server') {
                let geom = bundle.graphic.geometry;

                // check projection
                if (!geoApi.proj.isSpatialRefEqual(geom.spatialReference, spatialReference)) {
                    geom = geoApi.proj.localProjectGeometry(spatialReference, geom);
                }

                // determine symbol for this server graphic
                const attribs = bundle.layer.attributeBundle;
                return attribs[bundle.featureIdx].layerData.then(layerData => {
                    const symb = geoApi.symbology.getGraphicSymbol(bundle.graphic.attributes, layerData.renderer);
                    return geoApi.hilight.geomToGraphic(geom, symb);
                });

            } else {
                // local graphic. clone and hilight
                return Promise.resolve(geoApi.hilight.cloneLayerGraphic(bundle.graphic));
            }
        });
    };
}

function hilightBuilder(esriBundle) {
    /**
    * Generate a graphic layer to handle feature hilighting.
    * @method makeHilightLayer
    * @param {Object} options optional settings for the hilight layer
    *                         layerId - id to use for the hilight layer. defaults to rv_hilight
    *                         markerSymbol - esri symbol in server json format to symbolize the click marker. defaults to a red pin
    * @return {Object} an ESRI GraphicsLayer
    */
    return options => {
        // set options
        let id = 'rv_hilight';
        let markerSymbol = defaultSymbols.markerSymbol;

        if (options) {
            if (options.layerId) {
                id = options.layerId;
            }
            if (options.markerSymbol) {
                markerSymbol = options.markerSymbol;
            }

        }

        const hgl = new esriBundle.GraphicsLayer({ id, visible: true });

        /**
        * Add a graphic to indicate where user clicked.
        * @method addPin
        * @param {Point} point an ESRI point object to use as the graphic location
        */
        hgl.addMarker = point => {
            hgl.clear();

            const marker = new esriBundle.Graphic({ symbol: markerSymbol });
            marker.setGeometry(point);
            hgl.add(marker);
        };

        /**
        * Add a graphic or array of graphics to the highlight layer. Remove any previous graphics.
        * @method addHilight
        * @param {Graphic|Array} graphic an ESRI graphic, or array of ESRI graphics. Should be in map spatialReference, and not bound to a layer
        */
        hgl.addHilight = graphic => {
            hgl.clear();

            const graphics = Array.isArray(graphic) ? graphic : [graphic];

            // add new hilight graphics
            graphics.forEach(g => hgl.add(g));
        };

        /**
        * Remove hilight from map
        * @method clearHilight
        */
        hgl.clearHilight = () => {
            hgl.clear();
        };

        return hgl;
    };
}

module.exports = (esriBundle, geoApi) => ({
    makeHilightLayer: hilightBuilder(esriBundle),
    geomToGraphic: graphicBuilder(esriBundle),
    cloneLayerGraphic: cloneBuilder(esriBundle),
    getUnboundGraphics: getGraphicsBuilder(esriBundle, geoApi)
});
