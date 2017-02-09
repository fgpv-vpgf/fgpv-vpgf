'use strict';

/**
 * Make basemap gallery based on the settings of basemap metadata.
 *
 * @function
 * @param {Object} esriBundle ESRI modules from the initial startup
 * @param {Array} basemapsConfig array of basemap settings in the form { id: string, layers: [string], title: string, thumbnailUrl: string, wkid: integer }
 * @param {esriMap} map ESRI map object
 * @return {Object} an object with the following properties:
 * <ul>
 *   <li>setBasemap {function} set current basemap with a basemap uid</li>
 *   <li>basemapGallery {object} basemapGallery object</li>
 * </ul>
 */
function initBasemaps(esriBundle, basemapsConfig, map) {

    const basemapGallery = new esriBundle.BasemapGallery({ showArcGISBasemaps: false, map });

    // iterate throuh basemap configs
    basemapsConfig.forEach(basemapConfig => {

        // create basemap, add to basemap gallery
        const layers = basemapConfig.layers.map(config => new esriBundle.BasemapLayer({ url: config.url }));

        const basemap = new esriBundle.Basemap({
            id: basemapConfig.id,
            layers: layers,
            title: basemapConfig.name,
            thumbnailUrl: basemapConfig.thumbnailUrl,
            wkid: basemapConfig.wkid
        });

        basemapGallery.add(basemap);
    });

    // finalize basmap gallery
    basemapGallery.startup();

    // display message
    // TODO: add ui hook? to display msg on screen
    basemapGallery.on('error', msg => { throw new Error(msg); });

    return basemapGallery;
}

/**
  *
  * The `Basemap` module provides basemap related functions.
  *
  * This module exports an object with the following properties
  * - `Basemap` esri/dijit/Basemap class
  * - `BasemapGallery` esri/dijit/BasemapGallery class
  * - `BasemapLayer` esri/dijit/BasemapLayer class
  * - `makeBasemaps` function that makes a basemap gallery based on the settings provided
  */

// Basemap related modules
module.exports = { initBasemaps };
