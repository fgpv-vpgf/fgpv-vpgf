'use strict';

/**
  * @ngdoc module
  * @name basemap
  * @module geoAPI
  * @description
  *
  * The `Basemap` module provides basemap related functions.
  *
  * This module exports an object with the following properties
  * - `Basemap` {type} esri/dijit/Basemap class
  * - `BasemapGallery` {type} esri/dijit/BasemapGallery class
  * - `BasemapLayer`{type} esri/dijit/BasemapLayer class
  * - `makeBasemaps` {function} function make basemap gallery based on the settings provided
  */

// Basemap related modules
module.exports = function (esriBundle) {
    /**
     * @ngdoc method
     * @name makeBasemaps
     * @memberof basemap
     * @description make basemap gallery based on the settings of basemap metadata
     * @param {Object} basemapsConfig json config object contains collection/array of basemap settings
     * @param {esriMap} map ESRI map object
     * @param {String} anchorId DOM element where the dijit will be placed
     * @return {Object} an object with the following properties:
     * <ul>
     *   <li>setBasemap {function} set current basemap with a basemap uid</li>
     *   <li>basemapGallery {object} basemapGallery object</li>
     * </ul>
     */
    function makeBasemaps(basemapsConfig, map, anchorId) {

        let basemap;

        let basemapGallery = new esriBundle.BasemapGallery({
            showArcGISBasemaps: false,
            map: map
        }, anchorId);

        // iterate throuh basemap configs
        basemapsConfig.forEach(basemapConfig => {

            let layers = [];

            basemapConfig.layers.forEach(layerConfig => {
                // create basemap, add to basemap gallery
                let layer = new esriBundle.BasemapLayer({
                    url: layerConfig.url
                });

                layers.push(layer);
            });

            basemap = new esriBundle.Basemap({
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
        basemapGallery.on('error', msg => {
          console.error('basemap gallery error:', msg);
        });

        // Set basemap by id
        function setBasemap(id) {
            // set the basemap based on the id provided
            basemapGallery.select(id);
        }

        return {
            setBasemap: setBasemap,
            basemapGallery: basemapGallery
        };
    }

    return {
        Basemap: esriBundle.Basemap,
        BasemapGallery: esriBundle.BasemapGallery,
        BasemapLayer: esriBundle.BasemapLayer,
        makeBasemaps: makeBasemaps
    };
};
