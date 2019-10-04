'use strict';
const agol = require('./agol.js');
const attribute = require('./attribute.js');
const events = require('./events.js');
const hilight = require('./hilight.js');
const layer = require('./layer.js');
const legend = require('./legend.js');
const esriMap = require('./map/esriMap.js');
const proj = require('./proj.js');
const query = require('./query.js');
const shared = require('./shared.js');
const symbology = require('./symbology.js');

// interfaces with the dojo module loader, wraps everything in a promise.
function makeDojoRequests(modules, window) {
    return new Promise(function (resolve, reject) {

        // NOTE: do not change the callback to an arrow function since we don't know if
        // Dojo's require has any expectations of the scope within that function or
        // does any odd metaprogramming
        window.require(modules.map(mod => mod[0]), function () {
            const esriBundle = {};

            // iterate over arguments to avoid creating an ugly giant function call
            // arguments is not an array so we do this the hard way
            for (let i = 0; i < arguments.length; ++i) {
                esriBundle[modules[i][1]] = arguments[i];
            }
            resolve(esriBundle);
        });

        window.require.on('error', () => reject());
    });
}

// essentially sets up the main geoApi module object and initializes all the subcomponents
function initAll(esriBundle, window) {
    const api = {};

    api.layer = layer(esriBundle, api);
    api.legend = legend();
    api.proj = proj(esriBundle);
    api.Map = esriMap(esriBundle, api);
    api.attribs = attribute(esriBundle, api);
    api.symbology = symbology(esriBundle, api, window);
    api.hilight = hilight(esriBundle, api);
    api.events = events();
    api.query = query(esriBundle);
    api.shared = shared(esriBundle);
    api.agol = agol(esriBundle);

    // use of the following `esri` properties/functions are unsupported by ramp team.
    // they are provided for plugin developers who want to write advanced geo functions
    // and wish to directly consume the esri api objects AT THEIR OWN RISK !!!  :'O  !!!

    // access to the collection of ESRI API classes that geoApi loads for its own use
    api.esriBundle = esriBundle;

    // function to load ESRI API classes that geoApi does not auto-load.
    // param `modules` is an array of arrays, the inner arrays are 2-element consisting
    // of the official library path as the first element, and the property name in the
    // result object to assign the class to.
    // e.g. [['esri/tasks/FindTask', 'findTaskClass'], ['esri/geometry/mathUtils', 'mathUtils']]
    // return value is object with properties containing the dojo classes defined in the param.
    // e.g. { findTaskClass: <FindTask Dojo Class>, mathUtils: <mathUtils Dojo Class> }
    api.esriLoadApiClasses = modules => makeDojoRequests(modules, window);

    return api;
}

module.exports = function (esriLoaderUrl, window) {

    // esriDeps is an array pairing ESRI JSAPI dependencies with their imported names
    // in esriBundle
    const esriDeps = [
        ['dojo/Deferred', 'Deferred'],
        ['dojo/query', 'dojoQuery'],
        ['esri/Color', 'Color'],
        ['esri/config', 'esriConfig'],
        ['esri/dijit/Basemap', 'Basemap'],
        ['esri/dijit/BasemapGallery', 'BasemapGallery'],
        ['esri/dijit/BasemapLayer', 'BasemapLayer'],
        ['esri/dijit/OverviewMap', 'OverviewMap'],
        ['esri/dijit/Scalebar', 'Scalebar'],
        ['esri/geometry/Extent', 'Extent'],
        ['esri/geometry/Multipoint', 'Multipoint'],
        ['esri/geometry/Point', 'Point'],
        ['esri/geometry/Polygon', 'Polygon'],
        ['esri/geometry/Polyline', 'Polyline'],
        ['esri/geometry/ScreenPoint', 'ScreenPoint'],
        ['esri/graphic', 'Graphic'],
        ['esri/graphicsUtils', 'graphicsUtils'],
        ['esri/layers/ArcGISDynamicMapServiceLayer', 'ArcGISDynamicMapServiceLayer'],
        ['esri/layers/ArcGISImageServiceLayer', 'ArcGISImageServiceLayer'],
        ['esri/layers/ArcGISTiledMapServiceLayer', 'ArcGISTiledMapServiceLayer'],
        ['esri/layers/FeatureLayer', 'FeatureLayer'],
        ['esri/layers/GraphicsLayer', 'GraphicsLayer'],
        ['esri/layers/ImageParameters', 'ImageParameters'],
        ['esri/layers/LayerDrawingOptions', 'LayerDrawingOptions'],
        ['esri/layers/WMSLayer', 'WmsLayer'],
        ['esri/layers/WMSLayerInfo', 'WMSLayerInfo'],
        ['esri/map', 'Map'],
        ['esri/renderers/ClassBreaksRenderer', 'ClassBreaksRenderer'],
        ['esri/renderers/SimpleRenderer', 'SimpleRenderer'],
        ['esri/renderers/UniqueValueRenderer', 'UniqueValueRenderer'],
        ['esri/request', 'esriRequest'],
        ['esri/SpatialReference', 'SpatialReference'],
        ['esri/symbols/jsonUtils', 'symbolJsonUtils'],
        ['esri/symbols/PictureMarkerSymbol', 'PictureMarkerSymbol'],
        ['esri/symbols/SimpleFillSymbol', 'SimpleFillSymbol'],
        ['esri/symbols/SimpleLineSymbol', 'SimpleLineSymbol'],
        ['esri/symbols/SimpleMarkerSymbol', 'SimpleMarkerSymbol'],
        ['esri/tasks/GeometryService', 'GeometryService'],
        ['esri/tasks/IdentifyParameters', 'IdentifyParameters'],
        ['esri/tasks/IdentifyTask', 'IdentifyTask'],
        ['esri/tasks/ProjectParameters', 'ProjectParameters'],
        ['esri/tasks/query', 'Query'],
        ['esri/tasks/QueryTask', 'QueryTask'],
        ['esri/tasks/PrintParameters', 'PrintParameters'],
        ['esri/tasks/PrintTask', 'PrintTask'],
        ['esri/tasks/PrintTemplate', 'PrintTemplate']
    ];

    // the startup for this module is:
    // 1. add a script tag to load the API (this typically points to a custom ESRI build)
    // 2. load all the ESRI and Dojo dependencies `makeDojoRequests()`
    // 3. initialize all of our modules
    // everything is done in an async model and the result is a promise which resolves to
    // a reference to our API
    return new Promise(function (resolve, reject) {
        if (window.require) {
            console.warn('window.require has been set, ' +
                'attempting to reuse existing loader with no new script tag created');
            resolve();
            return;
        }

        const oScript = window.document.createElement('script');
        const oHead = window.document.head || window.document.getElementsByTagName('head')[0];

        oScript.type = 'text\/javascript';
        oScript.onerror = err => reject(err);
        oScript.onload = () => resolve();
        oHead.appendChild(oScript);
        oScript.src = esriLoaderUrl; // '//ec.cloudapp.net/~aly/esri/dojo/dojo.js';
        console.log('made a promise');
    }).then(() => makeDojoRequests(esriDeps, window))
      .then(esriBundle => initAll(esriBundle, window));
};
