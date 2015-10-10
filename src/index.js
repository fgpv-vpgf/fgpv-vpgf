'use strict';
function grayMapFactory(esriBundle) {
    return function (element) {
        console.info('made a map');
        return esriBundle.map(element, { basemap: 'gray', zoom: 6, center: [-100, 50] });
    };
}

function initAll(esriBundle) {
    return {
        grayMap: grayMapFactory(esriBundle)
    };
}

module.exports = function (esriLoaderUrl, window) {

    function makeDojoRequests() {
        return new Promise(function (resolve, reject) {
            window.require(['esri/map'], function (map) {
                let esriBundle = { map };
                resolve(esriBundle);
            });
            window.require.on('error', reject);
        });
    }

    return new Promise(function (resolve,reject) {
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
