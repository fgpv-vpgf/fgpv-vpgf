'use strict';

// ugly way to add rgbcolor to global scope so it can be used by canvg inside the viewer; this is done because canvg uses UMD loader and has rgbcolor as internal dependency; there is no elegant way around it; another approach would be to clone canvg and change its loader;
window.RGBColor = require('rgbcolor');
const canvg = require('canvg-origin');
const shared = require('./shared.js')();

const XML_ATTRIBUTES = {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    version: '1.1'
};

/**
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
                resolve(shared.convertImageToCanvas(response.url)),
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
* @param {Object} canvas [optional = null] canvas to draw the image upon; if not supplied, a new canvas will be made
* @return {Promise} resolving when the canvas have been created
*                           resolve with a canvas element with user added layer on it
*/
function generateLocalCanvas(map, canvas = null) {
    canvas = canvas || document.createElement('canvas');  // create canvas element

    // find esri map's svg node
    // check if xmlns prefixes are set - they aren't; add them
    // without correct prefixes, Firefox and IE refuse to render svg onto the canvas; Chrome works;
    // related issues: fgpv-vpgf/fgpv-vpgf#1324, fgpv-vpgf/fgpv-vpgf#1307, fgpv-vpgf/fgpv-vpgf#1306
    const svgNode = document.getElementById(`esri\.Map_${map.id.split('_')[1]}_gc`);
    if (!svgNode.getAttribute('xmlns')) {
        Object.entries(XML_ATTRIBUTES).forEach(([key, value]) =>
            svgNode.setAttribute(key, value));
    }

    const generationPromise = new Promise((resolve, reject) => {
        // parse the svg
        // convert svg text to canvas and stuff it into canvas canvas dom node

        // wrapping in try/catch since canvg has NO error handling; not sure what errors this can catch though
        try {
            // convert svg to text (use map id to select the svg container), then render svgxml back to canvas
            canvg(canvas, svgNode.outerHTML, {
                useCORS: true,
                ignoreAnimation: true,
                ignoreMouse: true,
                renderCallback: () =>
                    resolve(canvas)
            });
        } catch (error) {
            reject(error);
        }
    });

    return generationPromise;
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

        const localPromise = generateLocalCanvas(map);
        const serverPromise = generateServerImage(esriBundle, geoApi, map, options);

        // generate image with server layer from esri print task
        return {
            localPromise,
            serverPromise
        };
    };
}

// Print map related modules
module.exports = (esriBundle, geoApi) => {
    return {
        print: printMap(esriBundle, geoApi),
    };
};
