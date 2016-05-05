// Common functions for use across other geoApi modules

function getLayerTypeBuilder(esriBundle) {
    /**
    * Will return a string indicating the type of layer a layer object is.
    * @method getLayerType
    * @param  {Object} layer an ESRI API layer object
    * @return {String} layer type
    */
    return layer => {
        if (layer instanceof esriBundle.FeatureLayer) {
            return 'FeatureLayer';
        } else if (layer instanceof esriBundle.WmsLayer) {
            return 'WmsLayer';
        } else if (layer instanceof esriBundle.ArcGISDynamicMapServiceLayer) {
            return 'ArcGISDynamicMapServiceLayer';
        } else if (layer instanceof esriBundle.ArcGISTiledMapServiceLayer) {
            return 'ArcGISTiledMapServiceLayer';
        } else {
            // Can add more types above as we support them
            return 'UNKNOWN';
        }
    };

}

/**
* Get a 'good enough' uuid. For backup purposes if client does not supply its own
* unique layer id
*
* @method  generateUUID
* @returns {String} a uuid
*/
function generateUUID() {
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        // do math!
        /*jslint bitwise: true */
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        /*jslint bitwise: false */
    });
}

module.exports = esriBundle => ({
    getLayerType: getLayerTypeBuilder(esriBundle),
    generateUUID
});
