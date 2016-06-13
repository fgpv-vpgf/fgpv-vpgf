(() => {
    /**
     * @ngdoc service
     * @name metadataService
     * @module app.geo
     *
     * @description
     * Generates handlers for feature identification on all layer types.
     */
    angular
        .module('app.geo')
        .factory('metadataService', metadataService);

    function metadataService($q, $http) {

        const service = {
            transformXML
        };

        return service;

        /*
        * Transform XML using XSLT
        * @param {string} xmlString text data of the XML document
        * @param {string} xslString text data of the XSL document
        * @param {bool} returnFragment True if you want a document fragment returned (doesn't work
        * in IE)}
        * @param {Array} params a list of paramters to apply to the transform
        * @return {object} transformed document
        */
        function applyXSLT(xmlString, xslString, returnFragment, params) {
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
                output = xsltProc.output;
            }

            return output;
        }

        /*
        * Load file
        * @param {string} filename url to the file
        * @return {promise} promise if file will be loaded
        */
        function loadXMLFilePromise(fileUrl) {
            return $http.get(fileUrl)
                        .then(response => response.data)
                        .catch(error => console.error(`XHR request failed. Error: ${error}`));
        }

        /**
        * Applies supplied xslt to supplied xml. IE always returns a String; others may return a documentFragment or a jObject.
        *
        * @method transformXML
        * @static
        * @param {String} xmlUrl Location of the xml file
        * @param {String} xslUrl Location of the xslt file
        * @param {Boolean} returnFragment True if you want a document fragment returned (doesn't work in IE)}
        */
        function transformXML(xmlUrl, xslUrl, returnFragment, params) {

            console.log('transformXML');

            const loadPromises = [loadXMLFilePromise(xmlUrl), loadXMLFilePromise(xslUrl)];

            return $q.all(loadPromises)
                .then(([xmlData, xslData]) => applyXSLT(xmlData, xslData, returnFragment, params))
                .catch(err => console.error('Error: ' + err));

        }

    }

})();
