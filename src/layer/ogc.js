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

    const query = esriBundle.dojoQuery;

    /**
     * Fetch layer data from a WMS endpoint.  This method will execute a WMS GetCapabilities
     * request against the specified URL, it requests WMS 1.3 and it is capable of parsing
     * 1.3 or 1.1.1 responses.  It returns a promise which will resolve with basic layer
     * metadata and querying information.
     *
     * metadata response format:
     *   { queryTypes: [mimeType(str)],
     *     layers: [
     *       {name(str), desc(str), queryable(bool), layers:[recursive] }
     *     ] }
     *
     * @param {string} wmsEndpoint a URL pointing to a WMS server (it must not include a query string)
     * @return {Promise} a promise resolving with a metadata object (as specified above)
     */
    return (wmsEndpoint) => {
        const reqPromise = new Promise(resolve => {
            getCapabilities()
                .then(data => resolve(data)) // if successful, pass straight back
                .catch(() => { // if errors, try again; see fgpv-vpgf/fgpv-vpgf#908 issue
                    console.error('Get capabilities failed; trying the second time;');
                    resolve(getCapabilities());
                });
        });

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

        // find all <Layer> nodes under the given XML node
        // pick title, name and queryable nodes/attributes
        // recursively called on all child <Layer> nodes
        function getLayers(xmlNode) {
            return query('> Layer', xmlNode).map(layer => {
                const nameNode = getImmediateChild(layer, 'Name');
                const titleNode = getImmediateChild(layer, 'Title');
                return {
                    name: nameNode ? nameNode.textContent : null,
                    desc: titleNode.textContent,
                    queryable: layer.getAttribute('queryable') === '1',
                    layers: getLayers(layer)
                };
            });
        }

        function getCapabilities() {
            return Promise.resolve(new esriBundle.esriRequest({
                url: wmsEndpoint + '?service=WMS&version=1.3&request=GetCapabilities',
                handleAs: 'xml'
            }).promise);
        }

        return reqPromise.then(data => ({
            layers: getLayers(query('Capability', data)[0]),
            queryTypes: query('GetFeatureInfo > Format', data).map(node => node.textContent)
        }));
    };

}

/**
 * Recursively crawl a wms layer info structure. Store any legends in the provided map object.
 *
 * @private
 * @param {Array} layerInfos array of ESRI WMSLayerInfo objects
 * @param {Map} urlMap a Map of sublayer names to legend urls
 */
function crawlLayerInfos(layerInfos, urlMap) {
    layerInfos.forEach(li => {
        if (li.name) {
            urlMap.set(li.name, li.legendURL);
        }
        if (li.subLayers.length > 0) {
            crawlLayerInfos(li.subLayers, urlMap);
        }
    });
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
    crawlLayerInfos(wmsLayer.layerInfos, liMap);
    return layerList.map(l => liMap.get(l));
}

module.exports = esriBundle => {
    return {
        WmsLayer: esriBundle.WmsLayer,
        getFeatureInfo: getFeatureInfoBuilder(esriBundle),
        parseCapabilities: parseCapabilitiesBuilder(esriBundle),
        getLegendUrls
    };
};
