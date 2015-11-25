'use strict';

// Basemap related modules
module.exports = function (esriBundle) {

    /**
    * make basemap gallery based on the settings of basemap metadata
    * @param {Ojbect} settings json config object contains collection/array of basemap settings
    * @param {esriMap} map ESRI map object
    * @param {String} anchorId DOM element where the dijit will be placed
    * @return {Object} wrapper object for basemapGallery dijit
    */
    function makeBasemaps(settings, map, anchorId) {

        var layer;
        var basemap;

        let basemapGallery = new esriBundle.BasemapGallery({
            showArcGISBasemaps: false,
            map: map
        }, anchorId);

        // iterate throuh basemap configs
        settings.forEach((basemapSetting)=> {
            // create basemap, add to basemap gallery
            layer = new esriBundle.BasemapLayer({
                url: basemapSetting.url
            });

            basemap = new esriBundle.Basemap({
                id: basemapSetting.id,
                layers:[layer],
                title: basemapSetting.title,
                thumbnailUrl: basemapSetting.thumbnailUrl
            });

            basemapGallery.add(basemap);
        });

        // finalize basmap gallery
        basemapGallery.startup();

        // Set basemap by id
        function setBasemap(id) {
            // set the basemap based on the id provided
            this.basemapGallery.select(id);
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
        BasemapToggle: esriBundle.BasemapToggle,
        makeBasemaps: makeBasemaps
    };
};
