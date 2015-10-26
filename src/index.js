'use strict';
const layer = require('./layer.js');

function grayMapFactory(esriBundle) {
    return function (element) {
        console.info('made a map');
        return esriBundle.Map(element, { basemap: 'gray', zoom: 6, center: [-100, 50] });
    };
}

function initAll(esriBundle) {
    let debug = false;
    return {
        grayMap: grayMapFactory(esriBundle),
        layer: layer(esriBundle),
        debug: function () {
            if (arguments.length === 1) {
                debug = arguments[0] === true;
            }
        },
        esriBundle: function () {
            if (debug) {
                return esriBundle;
            }
            throw new Error('Must set debug to directly access the bundle');
        }
    };
}

module.exports = function (esriLoaderUrl, window) {

    // esriDeps is an array pairing ESRI JSAPI dependencies with their imported names
    // in esriBundle
    const esriDeps = [
        ['esri/map', 'Map'],
        ['esri/layers/FeatureLayer', 'FeatureLayer'],
        ['esri/layers/GraphicsLayer', 'GraphicsLayer'],
        ['esri/layers/WMSLayer', 'WmsLayer'],
    ];

    function makeDojoRequests() {
        return new Promise(function (resolve, reject) {

            // NOTE: do not change the callback to an arrow function since we don't know if
            // Dojo's require has any expectations of the scope within that function or
            // does any odd metaprogramming
            window.require(esriDeps.map(deps => deps[0]), function () {
                const esriBundle = {};

                // iterate over arguments to avoid creating an ugly giant function call
                // arguments is not an array so we do this the hard way
                for (let i = 0; i < arguments.length; ++i) {
                    esriBundle[esriDeps[i][1]] = arguments[i];
                }
                resolve(esriBundle);
            });
            window.require.on('error', reject);
        });
    }

    // the startup for this module is:
    // 1. add a script tag to load the API (this typically points to a custom ESRI build)
    // 2. load all the ESRI and Dojo dependencies `makeDojoRequests()`
    // 3. initialize all of our modules
    // everything is done in an async model and the result is a promise which resolves to
    // a reference to our API
    return new Promise(function (resolve, reject) {
        const oScript = window.document.createElement('script');
        const oHead = window.document.head || window.document.getElementsByTagName('head')[0];

        oScript.type = 'text\/javascript';
        oScript.onerror = err => reject(err);
        oScript.onload = () => resolve();
        oHead.appendChild(oScript);
        oScript.src = esriLoaderUrl; //'//ec.cloudapp.net/~aly/esri/dojo/dojo.js';
        console.log('made a promise');
    }).then(makeDojoRequests).then(initAll);
};
