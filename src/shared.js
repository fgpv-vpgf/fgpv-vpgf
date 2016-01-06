'use strict';

// Common functions for use across other geoApi modules
module.exports = esriBundle => {

    /**
    * Will return a string indicating the type of layer a layer object is.
    * @private
    * @param  {Object} layer an ESRI API layer object
    * @return {String} layer type
    */
    function getLayerType(layer) {
        if (layer instanceof esriBundle.FeatureLayer) {
            return 'FeatureLayer';
        } else if (layer instanceof esriBundle.WmsLayer) {
            return 'WmsLayer';
        } else if (layer instanceof esriBundle.ArcGISDynamicMapServiceLayer) {
            return 'ArcGISDynamicMapServiceLayer';
        } else if (layer instanceof esriBundle.ArcGISTiledMapServiceLayer) {
            return 'ArcGISTiledMapServiceLayer';
        } else {
            //Can add more types above as we support them
            return 'UNKNOWN';
        }
    }

    return {
        getLayerType
    };
};
