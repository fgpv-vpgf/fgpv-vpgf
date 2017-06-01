// Common functions for use across other geoApi modules
'use strict';

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

/**
* Convert an image to a canvas element
*
* @param {String} url image url to convert (result from the esri print task)
* @param {Object} canvas [optional = null] canvas to draw the image upon; if not supplied, a new canvas will be made
* @param {Boolean} crossOrigin [optional = true] when set, tries to fetch an image with crossOrigin = anonymous
* @return {Promise} conversion promise resolving into a canvas of the image
*/
function convertImageToCanvas(url, canvas = null, crossOrigin = true) {
    canvas = canvas || window.document.createElement('canvas');

    const image = window.document.createElement('img'); // create image node

    if (crossOrigin) {
        image.crossOrigin = 'Anonymous'; // configure the CORS request
    }

    const conversionPromise = new Promise((resolve, reject) => {
        image.addEventListener('load', () => {

            canvas.width = image.width; // changing canvas size will clear all previous content
            canvas.height = image.height;
            canvas.getContext('2d').drawImage(image, 0, 0); // draw image onto a canvas

            // return canvas
            resolve(canvas);
        });
        image.addEventListener('error', error =>
            reject(error));
    });

    // set image source to the one generated from the print task
    image.src = url;

    return conversionPromise;
}

/**
 * Loads an image (as crossing) and converts it to dataURL. If a supplied imageUri is already a dataURL, just return it.
 * If an image fails to load with the crossing attribute, return the original imageUri
 *
 * @function convertImagetoDataURL
 * @param {String} imageUri url of the image to load and convert
 * @param {String} imageType [optional = 'image/png'] format of the image representation
 * @return {Promise} promise resolving with the dataURL of the image
 */
function convertImagetoDataURL(imageUri, imageType = 'image/png') {
    // this is already a dataUrl, just return
    if (imageUri.startsWith('data')) {
        console.log('ImageUri is already a data url');
        return Promise.resolve(imageUri);
    }

    const loadingPromise = convertImageToCanvas(imageUri)
        .then(canvas => {
            console.log('Converting image to dataURL');
            return canvas.toDataURL(imageType);
        })
        .catch(error => {
            console.error('Failed to load crossorigin image', imageUri, error);
            return imageUri;
        });

    return loadingPromise;
}

module.exports = esriBundle => ({
    getLayerType: getLayerTypeBuilder(esriBundle),
    generateUUID,
    convertImageToCanvas,
    convertImagetoDataURL
});
