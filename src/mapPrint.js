'use strict';
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
  * - `exportMap`
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

    return new Promise((resolve, reject) => {
        // can be use to debug print task. Gives parameters to call directly the print task from it's interface
        // http://resources.arcgis.com/en/help/rest/apiref/exportwebmap_spec.html
        // http://snipplr.com/view/72400/sample-json-representation-of-an-esri-web-map-for-export-web-map-task
        // const mapJSON = printTask._getPrintDefinition(map, printParams);
        // console.log(JSON.stringify(mapJSON));

        // need to hide large user added layer to avoid CORS error (check typeof layer type)
        // user added layer are undefined and Feature Layer are string
        const userLayers = hideLayers(map, 'string');

        // TODO: catch esriJobFailed. it does not trigger the complete or the error event. Need a way to catch it!
        // execute the print task
        printTask.execute(printParams, (response) => {
            resolve(response);
        },
            (error) => {
                reject(error);
            }
        );

        // show user added previously visible for canvg to create canvas
        showLayers(userLayers);
    });
}

/**
* Set user added layer visibility to false to avoid CORS error
*
* @param {Object} map esri map object
* @param {String} type layer to check
* @return {Array} layer array of layers where visibility is true
*/
function hideLayers(map, type) {
    return map.graphicsLayerIds
        .map(layerId => map.getLayer(layerId))
        .filter(layer => layer.visible && typeof layer.type !== type)
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
    // create a canvas out of file layers
    const serializer = new XMLSerializer();

    // need to hide service based feature layer to remove them from svg
    const featLayers = hideLayers(map, 'undefined');

    // convert svg text to canvas and stuff it into mapExportImgLocal canvas dom node
    return new Promise((resolve) => {
        // wait 500ms for user added to show after print task is launched
        setTimeout(() => {
            // convert svg to text (use map id to select the svg container)
            const svgtext = serializer
                .serializeToString(document.getElementById(`esri\.Map_${map.id.split('_')[1]}_gc`));

            // show feature layer previously visible
            showLayers(featLayers);

            // create canvas element
            const mapExportImgLocal = document.createElement('canvas');

            // parse the svg
            canvg(mapExportImgLocal, svgtext, {
                renderCallback: () => {
                    resolve(mapExportImgLocal);
                }
            });
        }, 500);
    });

}

/**
* Convert an image to a canvas element
*
* @param {Image} image the image to convert (result from the esri print task)
* @return {Canvas} canvas the new canvas element
*/
function convertImageToCanvas(image) {
    // convert image to canvas
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);

    return canvas;
}

/**
* Generate the print image by combining the output from esri print task and
* svg export of the user added layers.
*
* @param {Object} esriBundle bundle of API classes
* @param {Object} geoApi geoApi to determine if we are in debug mode
* @return {Object} the result and status of the print call
*                   - complete [bool]: true if the call was successful, false otherwise
*                   - canvas [HTMLCanvasElement]: the canvas of the composite image (only set if complete is true)
*                   - error[String]: the error details / exception object (only set if complete is false)
*/
function printMap(esriBundle, geoApi) {

    return (map, options) => {

        return new Promise((resolve) => {

            // generate image with server layer from esri print task
            const promiseServer = generateServerImage(esriBundle, geoApi, map, options);

            // generate canvas with visible user added layer
            const promiseLocal = generateLocalCanvas(map);

            // when all promises are resolved
            Promise.all([promiseServer, promiseLocal]).then((result) => {
                // create img element for print task image
                const mapExportImg = document.createElement('img');

                mapExportImg.addEventListener('load', () => {

                    // convert image to canvas for saving
                    let canvas = convertImageToCanvas(mapExportImg);

                    // smash local and print service canvases
                    const tc = canvas.getContext('2d');
                    tc.drawImage(result[1], 0, 0);

                    canvas = tc.canvas;

                    // return canvas
                    resolve({ complete: true, canvas });
                });

                // set image source to the one generated from the print task
                mapExportImg.src = result[0].url;
            }).catch((error) => {
                resolve({ complete: false, error });
            });
        });
    };
}

// Print map related modules
module.exports = (esriBundle, geoApi) => {
    return {
        print: printMap(esriBundle, geoApi),
    };
};
