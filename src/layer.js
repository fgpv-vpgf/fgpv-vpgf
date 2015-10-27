// NOTE: we should split this out if this module becomes too big
module.exports = function (esriBundle) {
    return {
        FeatureLayer: esriBundle.FeatureLayer,
        WmsLayer: esriBundle.WmsLayer,
        GraphicsLayer: esriBundle.GraphicsLayer
    };
};
