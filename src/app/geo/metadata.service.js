import XSLT from 'XSLT/xstyle_default_i18n.xsl';

/**
 * @module metadataService
 * @memberof app.geo
 *
 * @description
 * Retrieves and parses metadata in the format exposed by the data catalogue (TODO link to the spec if available).
 */
angular
    .module('app.geo')
    .factory('metadataService', metadataService);

function metadataService($q, $http, $translate, Geo) {

    const cache = {};

    const service = {
        loadFromURL
    };

    return service;

    /**
    * Applies an XSLT to XML, XML is provided but the XSLT is stored in a string constant.
    *
    * @method loadFromURL
    * @param {String} xmlUrl Location of the xml file
    * @param {Array} params an array which never seems to be set and is never used
    * @return {Promise} a promise resolving with an HTML fragment
    */
    function loadFromURL(xmlUrl, params) {
        if (cache.xmlUrl) {
            return $q.resolve(cache.xmlUrl);
        }

        return loadXmlFile(xmlUrl)
            .then(xmlData => applyXSLT(
                xmlData,
                XSLT.replace(/\{\{([\w\.]+)\}\}/g, (_, tag) => $translate.instant(tag)),
                params))
            .then(transformedXMLData => {
                cache.xmlUrl = transformedXMLData;
                return transformedXMLData;
            });
    }

    /**
    * Transform XML using XSLT
    * @function applyXSLT
    * @private
    * @param {string} xmlString text data of the XML document
    * @param {string} xslString text data of the XSL document
    * in IE)}
    * @param {Array} params a list of paramters to apply to the transform
    * @return {object} transformed document
    */
    function applyXSLT(xmlString, xslString, params) {
        let output = null;

        if (window.XSLTProcessor) {
            const xsltProc = new window.XSLTProcessor();
            const xmlDoc = $.parseXML(xmlString);
            const xslDoc = $.parseXML(xslString);
            xsltProc.importStylesheet(xslDoc);
            // [patched from ECDMP] Add parameters to xsl document (setParameter = Chrome/FF/Others)
            if (params) {
                params.forEach(p => xsltProc.setParameter(null, p.key, p.value || ''));
            }
            output = xsltProc.transformToFragment(xmlDoc, document);
        } else if (window.hasOwnProperty('ActiveXObject')) {
            // IE11 (╯°□°）╯︵ ┻━┻
            const xslt = new window.ActiveXObject('Msxml2.XSLTemplate');
            const xmlDoc = new window.ActiveXObject('Msxml2.DOMDocument');
            const xslDoc = new window.ActiveXObject('Msxml2.FreeThreadedDOMDocument');
            xmlDoc.loadXML(xmlString);
            xslDoc.loadXML(xslString);
            xslt.stylesheet = xslDoc;
            const xsltProc = xslt.createProcessor();
            xsltProc.input = xmlDoc;
            if (params) {
                params.forEach(p => xsltProc.addParameter(p.key, p.value, ''));
            }
            xsltProc.transform();
            output = document.createRange().createContextualFragment(xsltProc.output);
        }

        return output;
    }

    /**
    * Loads a file via XHR.  Nothing XML specific.
    * @function loadXmlFile
    * @param {String} url URL to the file
    * @return {Promise} promise resolving with the text data of the file
    */
    function loadXmlFile(url) {
        return $http.get(url)
            .then(response => response.data)
            .catch(error => {
                console.error('Metadata XHR request failed.');
                throw error;
            });
    }
}
