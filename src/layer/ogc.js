'use strict';
const yxList = require('./reversedAxis.json');

function getFeatureInfoBuilder(esriBundle) {
    /**
     * Handles click events for WMS layers (makes a WMS GetFeatureInfo call behind the scenes).
     *
     * @param {WMSLayer} wmsLayer an ESRI WMSLayer object to be queried
     * @param {Object} clickEvent an ESRI map click event (used for screen coordinates)
     * @param {Array} layerList a list of strings identifying the WMS layers to be queried
     * @param {String} mimeType the format to be requested for the response
     * @returns {Promise} a promise which resolves with the raw text of the GetFeatureInfo response
     */
    return (wmsLayer, clickEvent, layerList, mimeType) => {
        let wkid;
        let req;
        const esriMap = wmsLayer.getMap();
        const ext = esriMap.extent;
        const srList = wmsLayer.spatialReferences;
        const layers = layerList.join(',');

        if (srList && srList.length > 1) {
            wkid = srList[0];
        } else if (esriMap.spatialReference.wkid) {
            wkid = esriMap.spatialReference.wkid;
        }
        if (wmsLayer.version === '1.3' || wmsLayer.version === '1.3.0') {
            req = { CRS: 'EPSG:' + wkid, I: clickEvent.screenPoint.x, J: clickEvent.screenPoint.y,
                    STYLES: '', FORMAT: wmsLayer.imageFormat };
            if (yxList.indexOf(String(wkid)) > -1) {
                req.BBOX = `${ext.ymin},${ext.xmin},${ext.ymax},${ext.xmax}`;
            }
        } else {
            req = { SRS: 'EPSG:' + wkid, X: clickEvent.screenPoint.x, Y: clickEvent.screenPoint.y };
        }
        if (!req.hasOwnProperty('BBOX')) {
            req.BBOX = `${ext.xmin},${ext.ymin},${ext.xmax},${ext.ymax}`;
        }
        const settings = {
            SERVICE: 'WMS',
            REQUEST: 'GetFeatureInfo',
            VERSION: wmsLayer.version,
            WIDTH: esriMap.width,
            HEIGHT: esriMap.height,
            QUERY_LAYERS: layers,
            LAYERS: layers,
            INFO_FORMAT: mimeType
        };

        Object.keys(settings).forEach(key => req[key] = settings[key]);

        return Promise.resolve(esriBundle.esriRequest({
            url: wmsLayer.url.split('?')[0],
            content: req,
            handleAs: 'text'
        }));
    };
}

function parseCapabilitiesBuilder(esriBundle) {

    /**
     * Fetch layer data from a WMS endpoint.  This method will execute a WMS GetCapabilities
     * request against the specified URL, it requests WMS 1.3 and it is capable of parsing
     * 1.3 or 1.1.1 responses.  It returns a promise which will resolve with basic layer
     * metadata and querying information.
     *
     * metadata response format:
     *   { queryTypes: [mimeType], layers: [{name, desc, queryable(bool)}] }
     *
     * @param {string} wmsEndpoint a URL pointing to a WMS server (it must not include a query string)
     * @return {Promise} a promise resolving with a metadata object (as specified above)
     */
    return (wmsEndpoint) => {
        const reqPromise = Promise.resolve(new esriBundle.EsriRequest({
            url: wmsEndpoint + '?service=WMS&version=1.3&request=GetCapabilities',
            handleAs: 'xml'
        }).promise);

        // there might already be a way to do this in the parsing API
        // I don't know XML parsing well enough (and I don't want to)
        // this has now been ported from RAMP to FGPV and I still, happily,
        // do not know any more about XML parsing now
        function getImmediateChild(node, childName) {
            for (let i = 0; i < node.childNodes.length; ++i) {
                if (node.childNodes[i].nodeName === childName) {
                    return node.childNodes[i];
                }
            }
            return undefined;
        }

        reqPromise.then(data => {
            var layers, res = {};

            const namedlayers = query('Layer > Name', data).map((nameNode) { return nameNode.parentNode; });
            res.layers = layers.map(function (x) {
                const nameNode = getImmediateChild(x, 'Name');
                const name = nameNode.textContent || nameNode.text; // .text is for IE9's benefit, even though it claims to support .textContent
                const titleNode = getImmediateChild(x, 'Title');
                return {
                    name: name,
                    desc: titleNode ? (titleNode.textContent || titleNode.text) : name,
                    queryable: x.getAttribute('queryable') === '1'
                };
            });
            res.queryTypes = query('GetFeatureInfo > Format', data).map(function (node) { return node.textContent || node.text; });

            return res;
        })

            function (error) {
                console.log(error);
                def.reject(error);
            }
        );

        return def.promise;
    }

}

/**
 * Finds the appropriate legend URLs for WMS layers.
 *
 * @param {WMSLayer} wmsLayer an ESRI WMSLayer object to be queried
 * @param {Array} layerList a list of strings identifying the WMS layers to be queried
 * @returns {Array} a list of strings containing URLs for specified layers (order is preserved)
 */
function getLegendUrls(wmsLayer, layerList) {
    const liMap = new Map(); // use Map in case someone clever uses a WMS layer name that matches an Object's default properties
    wmsLayer.layerInfos.forEach(li => liMap.set(li.name, li.legendURL));
    return layerList.map(l => liMap.get(l));
}

module.exports = esriBundle => {
    return {
        WmsLayer: esriBundle.WmsLayer,
        getFeatureInfo: getFeatureInfoBuilder(esriBundle),
        getLegendUrls
    };
};
