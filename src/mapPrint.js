'use strict';

// ugly way to add rgbcolor to global scope so it can be used by canvg inside the viewer; this is done because canvg uses UMD loader and has rgbcolor as internal dependency; there is no elegant way around it; another approach would be to clone canvg and change its loader;
window.RGBColor = require('rgbcolor');
const canvg = require('canvg-origin');

/**
  * @ngdoc module
  * @name mapPrint
  * @module geoAPI
  * @description
  *
  * The `mapPrint` module provides map print and export image related functions.
  *
  * This module exports an object with the following functions
  * - `printMap`
  *
  * NOTE: unit tests might be difficult to implement as DOM is required...
  */

/**
* Generate the image from the esri print task
*
* @param {Object} esriBundle bundle of API classes
* @param {Object} geoApi geoApi to determine if we are in debug mode
* @param {Object} map esri map object
* @param {Object} options options for the print task
*                           url - for the esri geometry server
*                           format - output format
* @return {Promise} resolving when the print task created the image
*                           resolve with a "response: { url: value }" where url is the path
*                           for the print task export image
*/
function generateServerImage(esriBundle, geoApi, map, options) {
    // create esri print object with url to print server
    const printTask = esriBundle.PrintTask(options.url, { async: true });
    const printParams = new esriBundle.PrintParameters();
    const printTemplate = new esriBundle.PrintTemplate();

    // each layout has an mxd with that name on the server. We can modify and add new layout (mxd)
    // we only support MAP_ONLY for now. See https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1160
    printTemplate.layout = 'MAP_ONLY';

    // only use when layout is MAP_ONLY
    printTemplate.exportOptions = {
        height: map.height,
        width: map.width,
        dpi: 96
    };

    // pdf | png32 | png8 | jpg | gif | eps | svg | svgz
    printTemplate.format = options.format;
    printTemplate.showAttribution = false;

    // define whether the printed map should preserve map scale or map extent.
    // if true, the printed map will use the outScale property or default to the scale of the input map.
    // if false, the printed map will use the same extent as the input map and thus scale might change.
    // we always use true because the output image is the same size as the map (we have the same extent and
    // same scale)
    // we fit the image later because trying to fit the image with canvg when we add user added
    // layer is tricky!
    printTemplate.preserveScale = true;

    // set map and template
    printParams.map = map;
    printParams.template = printTemplate;

    // need to hide svg layers since we can generate an image for them locally
    const svgLayers = hideLayers(map);

    const printPromise = new Promise((resolve, reject) => {
        // can be use to debug print task. Gives parameters to call directly the print task from it's interface
        // http://resources.arcgis.com/en/help/rest/apiref/exportwebmap_spec.html
        // http://snipplr.com/view/72400/sample-json-representation-of-an-esri-web-map-for-export-web-map-task
        // const mapJSON = printTask._getPrintDefinition(map, printParams);
        // console.log(JSON.stringify(mapJSON));

        // TODO: catch esriJobFailed. it does not trigger the complete or the error event. Need a way to catch it!
        // execute the print task
        printTask.execute(printParams,
            response =>
                resolve(convertImageToCanvas(response.url)),
            error =>
                reject(error)
        );
    });

    // show user added previously visible for canvg to create canvas
    showLayers(svgLayers);

    return printPromise;
}

/**
* Set svg-based layer visibility to false to avoid CORS error
*
* @param {Object} map esri map object
* @return {Array} layer array of layers where visibility is true
*/
function hideLayers(map) {
    return map.graphicsLayerIds
        .map(layerId => map.getLayer(layerId))
        .filter(layer => layer.visible)
        .map(layer => {
            layer.setVisibility(false);
            return layer;
        });
}

/**
* Set user added layer visibility to true for those whoe where visible
*
* @param {Array} layers array of graphic layers to set visibility to true
*/
function showLayers(layers) {
    layers.forEach((layer) => layer.setVisibility(true));
}

/**
* Create a canvas from the user added layers (svg tag)
*
* @param {Object} map esri map object
* @return {Promise} resolving when the canvas have been created
*                           resolve with a canvas element with user added layer on it
*/
function generateLocalCanvas(map) {
    // convert svg to text (use map id to select the svg container)
    const svgtext = document.getElementById(`esri\.Map_${map.id.split('_')[1]}_gc`).outerHTML;
    const localCanvas = document.createElement('canvas'); // create canvas element

    const generationPromise = new Promise((resolve, reject) => {
        // parse the svg
        // convert svg text to canvas and stuff it into localCanvas canvas dom node

        // wrapping in try/catch since canvg has NO error handling; not sure what errors this can catch though
        try {
            canvg(localCanvas, svgtext, {
                useCORS: true,
                ignoreAnimation: true,
                ignoreMouse: true,
                renderCallback: () =>
                    resolve(localCanvas)
            });
        } catch (error) {
            reject(error);
        }
    });

    return generationPromise;
}

/**
* Convert an image to a canvas element
*
* @param {String} url image url to convert (result from the esri print task)
* @return {Promise} conversion promise resolving into a canvas of the image
*/
function convertImageToCanvas(url) {
    const canvas = document.createElement('canvas');
    const image = document.createElement('img'); // create image node
    image.crossOrigin = 'Anonymous'; // configure the CORS request

    const conversionPromise = new Promise((resolve, reject) => {
        image.addEventListener('load', () => {

            canvas.width = image.width;
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
* Generate the print image by combining the output from esri print task and
* svg export of the user added layers.
*
* @param {Object} esriBundle bundle of API classes
* @param {Object} geoApi geoApi to determine if we are in debug mode
* @return {Object} with two promises - local and server canvas; each promise resolves with a corresponding canvas; each promise can error separately if the canvas cannot be generated returning whatever error message was supplied; it's responsibility of the caller to handle errors appropriately
*/
function printMap(esriBundle, geoApi) {

    return (map, options) => {

        // generate image with server layer from esri print task
        return {
            localPromise: generateLocalCanvas(map),
            serverPromise: generateServerImage(esriBundle, geoApi, map, options)
        };
    };
}

// Print map related modules
module.exports = (esriBundle, geoApi) => {
    return {
        print: printMap(esriBundle, geoApi),
    };
};
