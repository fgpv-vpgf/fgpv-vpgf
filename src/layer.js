// NOTE: we should split this out if this module becomes too big
module.exports = function (esriBundle) {
    return {
        ArcGISDynamicMapServiceLayer: esriBundle.ArcGISDynamicMapServiceLayer,
        ArcGISImageServiceLayer: esriBundle.ArcGISImageServiceLayer,
        GraphicsLayer: esriBundle.GraphicsLayer,
        FeatureLayer: esriBundle.FeatureLayer,
        WmsLayer: esriBundle.WmsLayer
    };
};
