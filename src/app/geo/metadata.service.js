/* global window, ActiveXObject, XSLTProcessor */
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

    function metadataService($q) {

        const service = {
            transformXML
        };

        /*
        * Transform XML using XSLT
        * @param {string} xmlString url of the xml document
        * @param {string} xslString url of the xsl document
        * @param {bool} returnFragment True if you want a document fragment returned (doesn't work
        * in IE)}
        * @return {object} transformed document
        */
        function applyXSLT(xmlString, xslString, returnFragment, params) {
            let output;

            if (window.ActiveXObject || window.hasOwnProperty('ActiveXObject')) {
                output = applyXsltIE(xmlString, xslString, params);
            } else {
                output = applyXsltFF(xmlString, xslString, returnFragment, params);
            }
            return output;
        }

        // promise based file loader

        /*
        * IE 9 specific load file
        * @param {string} filename url to the file
        * @return {promise} promise if file will be loaded
        */
        const loadXMLFileIE9Promise = function (filename) {

            return $q((resolve, reject) => {
                let xdr = new window.XDomainRequest();
                xdr.open('GET', filename);
                xdr.onload = (responseObject) => {
                    resolve(responseObject);
                };

                xdr.ontimeout = () => {
                    console.warn('xdr timeout for ' + filename);
                };

                xdr.onprogress = () => {
                    console.log('xdr progress -' + filename);
                };

                xdr.onerror = (e) => {
                    reject('error:' + e);
                };
            });
        };

        /*
        * IE 10+ specific load file
        * @param {string} filename url to the file
        * @return {promise} promise if file will be loaded
        */
        const loadXMLFileIEPromise = function (filename) {

            return $q((resolve, reject) => {
                let xhttp = new XMLHttpRequest();

                xhttp.open('GET', filename);

                try {
                    xhttp.responseType = 'msxml-document';
                } catch (err) { reject('xhttp request failed, error: ' + err); } // Helping IE11

                xhttp.onreadystatechange = function () {

                    if (xhttp.readyState === 4) {
                        if (xhttp.status !== 200) {
                            reject('xhttp request failed, status code: ' + xhttp.status);
                        }

                        // resolveDeferred(filename, xhttp);
                        resolve(xhttp);
                    }
                };

            });
        };

        /*
        * Good Browser specific load file
        * @param {string} filename url to the file
        * @return {promise} promise if file will be loaded
        */
        const loadXMLFilePromise = function (fileUrl) {

            return $q((resolve, reject) => {
                $.ajax({
                    type: 'GET',
                    url: fileUrl,
                    dataType: 'xml',
                    cache: false,
                    success: (data) => {
                        resolve(data);
                    },
                    error: () => {
                        reject('failed to retrieve ' + fileUrl);
                    }
                });
            });

        };

        /*
        * IE specific xsl transformation process
        * @param {string} xmlString xml in string
        * @param {string} xslString xsl in string
        * @return {string} transformed doc
        */
        function applyXsltIE(xmlString, xslString, params) {

            console.log('applyXsltIE');

            // IE
            let i = 0;
            let xslt = new ActiveXObject('Msxml2.XSLTemplate');
            let xmlDoc = new ActiveXObject('Msxml2.DOMDocument');
            let xslDoc = new ActiveXObject('Msxml2.FreeThreadedDOMDocument');
            let xslProc;

            xmlDoc.loadXML(xmlString);
            xslDoc.loadXML(xslString);
            xslt.stylesheet = xslDoc;
            xslProc = xslt.createProcessor();
            xslProc.input = xmlDoc;

            // [patched from ECDMP] Add parameters to xsl document (addParameter = ie only)
            if (params) {
                for (i = 0; i < params.length; i++) {
                    xslProc.addParameter(params[i].key, params[i].value, '');
                }
            }

            xslProc.transform();

            return xslProc.output;
        }

        /*
        * IE specific xsl transformation process
        * @param {string} xmlString xml in string
        * @param {string} xslString xsl in string
        * @param {bool} returnFragment indicates if a doc fragment should be returned
        * @return {string} transformed doc
        */
        function applyXsltFF(xmlString, xslString, returnFragment, params) {

            console.log('applyXsltFF');
            let i = 0;
            let output = null;

            // Chrome/FF/Others
            var xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xslString);

            // [patched from ECDMP] Add parameters to xsl document (setParameter = Chrome/FF/Others)
            if (params) {
                for (i = 0; i < params.length; i++) {
                    xsltProcessor.setParameter(null, params[i].key, params[i].value || '');
                }
            }
            output = xsltProcessor.transformToFragment(xmlString, document);

            // turn a document fragment into a proper jQuery object
            if (!returnFragment) {
                output = ($('body')
                    .append(output)
                    .children().last())
                    .detach();
            }

            return output;
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

            let loadFunction = null;

            // map browser specific loadfunction to reduce cyclomatic complexities
            if ('withCredentials' in new XMLHttpRequest() && 'ActiveXObject' in window) {

                loadFunction = loadXMLFileIE9Promise;
            } else if (window.XDomainRequest) {

                loadFunction = loadXMLFileIEPromise;
            } else {

                loadFunction = loadXMLFilePromise;
            }

            // return a promise after all promises are fulfilled
            return loadFunction(xmlUrl).then(xmlData => {

                // xml data is ready, load xsl data
                return loadFunction(xslUrl).then(xslData => {

                    // both data are ready, run XSLT
                    // review this! Is the following required or could I just return
                    return applyXSLT(xmlData, xslData, returnFragment, params);

                    // return $q((resolve, reject) => {
                    //     const result = applyXSLT(xmlData, xslData, returnFragment, params);

                    //     // return result;
                    //     if (result) {
                    //         resolve(result);
                    //     } else {
                    //         reject('failed to apply xsl transformation');
                    //     }
                    // });
                });
            }).catch(err => {
                console.error('Error:' + err);
            });
        }

        return service;
    }

})();
