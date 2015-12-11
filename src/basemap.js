'use strict';

// Basemap related modules
module.exports = function (esriBundle) {

    /**
    * make basemap gallery based on the settings of basemap metadata
    * @param {Object} basemapsConfig json config object contains collection/array of basemap settings
    * @param {esriMap} map ESRI map object
    * @param {String} anchorId DOM element where the dijit will be placed
    * @return {Object} wrapper object for basemapGallery dijit
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
                id: basemapConfig.uid,
                layers: layers,
                title: basemapConfig.name,
                thumbnailUrl: basemapConfig.thumbnail
            });

            basemapGallery.add(basemap);
        });

        // finalize basmap gallery
        basemapGallery.startup();

        // Set basemap by uid
        function setBasemap(uid) {
            // set the basemap based on the id provided
            basemapGallery.select(uid);
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
