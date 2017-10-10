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

        // tear off any decimals from the screenpoint coords.
        const intX = parseInt(clickEvent.screenPoint.x);
        const intY = parseInt(clickEvent.screenPoint.y);

        if (srList && srList.length > 1) {
            wkid = srList[0];
        } else if (esriMap.spatialReference.wkid) {
            wkid = esriMap.spatialReference.wkid;
        }
        if (wmsLayer.version === '1.3' || wmsLayer.version === '1.3.0') {
            req = { CRS: 'EPSG:' + wkid, I: intX, J: intY, STYLES: '', FORMAT: wmsLayer.imageFormat };
            if (yxList.indexOf(String(wkid)) > -1) {
                req.BBOX = `${ext.ymin},${ext.xmin},${ext.ymax},${ext.xmax}`;
            }
        } else {
            req = { SRS: 'EPSG:' + wkid, X: intX, Y: intY };
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

        function getImmediateChildren(node, childName) {
            let children = [];
            for (let i = 0; i < node.childNodes.length; ++i) {
                if (node.childNodes[i].nodeName === childName) {
                    children.push(node.childNodes[i]);
                }
            }
            return children;
        }

        // find all <Layer> nodes under the given XML node
        // pick title, name and queryable nodes/attributes
        // also have a list of all styles and the current style
        // recursively called on all child <Layer> nodes
        function getLayers(xmlNode) {
            if (! xmlNode) {
                return [];
            }
            return query('> Layer', xmlNode).map(layer => {
                const nameNode = getImmediateChild(layer, 'Name');
                const titleNode = getImmediateChild(layer, 'Title');

                const allStyles = [];
                const styleToURL = {};
                const styles = getImmediateChildren(layer, 'Style');
                styles.forEach(style => {
                    const name = getImmediateChild(style, 'Name').textContent;
                    allStyles.push(name);

                    const legendURL = getImmediateChild(style, 'LegendURL');
                    const url = getImmediateChild(legendURL, 'OnlineResource').getAttribute('xlink:href');
                    styleToURL[name] = url;
                });

                return {
                    name: nameNode ? nameNode.textContent : null,
                    desc: titleNode.textContent,
                    queryable: layer.getAttribute('queryable') === '1',
                    layers: getLayers(layer),
                    allStyles: allStyles,
                    styleToURL, styleToURL,
                    currentStyle: allStyles[0]
                };
            });
        }

        function getCapabilities() {
            let url = wmsEndpoint;

            // if url has a '?' do not append to avoid errors, user must add this manually
            if (wmsEndpoint.indexOf('?') === -1) {
                url += '?service=WMS&version=1.3&request=GetCapabilities';
            }

            return Promise.resolve(new esriBundle.esriRequest({
                url,
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
 * Finds the appropriate legend URLs for WMS layers.
 *
 * @param {WMSLayer} wmsLayer an ESRI WMSLayer object to be queried
 * @param {Array} layerList a list of objects identifying the WMS layers to be queried
 * @returns {Array} a list of strings containing URLs for specified layers (order is preserved)
 */
function getLegendUrls(wmsLayer, layerList) {
    return layerList.map(l => l.styleToURL[l.currentStyle]);
}

module.exports = esriBundle => {
    return {
        WmsLayer: esriBundle.WmsLayer,
        getFeatureInfo: getFeatureInfoBuilder(esriBundle),
        parseCapabilities: parseCapabilitiesBuilder(esriBundle),
        getLegendUrls
    };
};
