/* global XSLTProcessor */
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
        * @param {string} xmlString url of the xml document
        * @param {string} xslString url of the xsl document
        * @param {bool} returnFragment True if you want a document fragment returned (doesn't work
        * in IE)}
        * @return {object} transformed document
        */
        function applyXSLT(xmlString, xslString, returnFragment, params) {

            let i = 0;
            let output = null;

            // Chrome/FF/Others
            const xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xslString);

            // [patched from ECDMP] Add parameters to xsl document (setParameter = Chrome/FF/Others)
            if (params) {
                for (i = 0; i < params.length; i++) {
                    xsltProcessor.setParameter(null, params[i].key, params[i].value || '');
                }
            }
            output = xsltProcessor.transformToFragment(xmlString, document);

            return output;

        }

        /*
        * Load file
        * @param {string} filename url to the file
        * @return {promise} promise if file will be loaded
        */
        function loadXMLFilePromise(fileUrl) {

            return $http({
                method: 'GET',
                url: fileUrl,
                responseType: 'xml',
                transformResponse: data => {
                    return $.parseXML(data);
                }
            }).then(response => {
                return response.data;
            }).catch(error => {
                console.err('xhttp reqest failed. Error: ' + error);
            });

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
