'use strict';
var basemap = require('./basemap.js');

// mapManager module, provides function to setup a map
module.exports = function (esriBundle) {
    var mapManager = {
        Scalebar: esriBundle.Scalebar
    };

    /**
    * setup map features with info provided by configuration
    * @param {esriMap} map ESRI map object
    * @param {Object} settings JSON object of map configurations
    * @return {Object} object with reference to widgets/controls created following configuration
    */
    mapManager.setupMap = function (map, settings) {

        // var map = arguments[0];
        // var settings = arguments[1];
        let basemapCtrl;
        let scalebarCtrl;

        // check to see if property exists in settings
        if ('basemaps' in settings) {

            // need to pass esriBundle to basemap module in order to use it
            // the alternative is to pass geoApi reference after creation, and then use the geoApi to
            // access the properly initialized modules.
            // or Is there an other way to do it?
            let lbasemap = basemap(esriBundle);

            // basemapCtrl is a basemap gallery object, should store this value for application use
            basemapCtrl = lbasemap.makeBasemaps(settings.basemaps, map);
        }

        // TODO: add code to setup scalebar
        if ('scalebar' in settings) {

            scalebarCtrl = new mapManager.Scalebar({
                map: map,
                attachTo: settings.scalebar.attachTo,
                scalebarUnit: settings.scalebar.scalebarUnit
            });

            scalebarCtrl.show();

        } else {
            console.log('scalebar setting does not exists');
        }

        // TODO: add code to setup north arrow

        // TODO: add code to setup overview map

        // TODO: add code to setup mouse co-ordinates

        // return as object so we can use this in our geo section of fgpv
        return {
            BasemapControl: basemapCtrl,
            ScalebarControl: scalebarCtrl
        };
    };

    return mapManager;
};
