"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates and manages the details and and zoom buttons for all the rows of one panel instance.
 *
 * This class contains a custom angular controller to enable the opening of the details panel, and the zoom functionality.
 */
var DetailsAndZoomButtons = /** @class */ (function () {
    function DetailsAndZoomButtons(panelManager) {
        this.panelManager = panelManager;
        this.mapApi = panelManager.mapApi;
        this.legendBlock = panelManager.legendBlock;
        this.currentTableLayer = panelManager.currentTableLayer;
        this.oidField = panelManager.currentTableLayer._layerProxy.oidField;
        this.setDetailsAndZoomButtons();
    }
    // registers the DetailsAndZoomCtrl
    DetailsAndZoomButtons.prototype.setDetailsAndZoomButtons = function () {
        var that = this;
        this.mapApi.agControllerRegister('DetailsAndZoomCtrl', function () {
            var proxy = that.legendBlock.proxyWrapper.proxy;
            // opens the details panel corresponding to the row where the details button is found
            this.openDetails = function (oid) {
                var data = proxy.formattedAttributes.then(function (attribs) {
                    var attributes = attribs.rows.find(function (attrib) {
                        if (attrib[that.oidField] === oid) {
                            return attrib;
                        }
                    });
                    var symbology = attributes['rvSymbol'];
                    var dataObj = [];
                    var map = that.mapApi.mapI;
                    var _loop_1 = function (key) {
                        var fieldData = attribs.fields.find(function (r) { return r.name === key; });
                        var attribObj = {
                            alias: that.currentTableLayer.attributeHeaders[key] ? that.currentTableLayer.attributeHeaders[key]['name'] : '',
                            clientAlias: (fieldData && fieldData.clientAlias) ? fieldData.clientAlias : undefined,
                            name: key,
                            domain: null,
                            type: null
                        };
                        // set the esriFieldType depending on the type of the value
                        if (key === proxy.oidField) {
                            attribObj.type = 'esriFieldTypeOID';
                        }
                        else if (typeof attributes[key] === 'string') {
                            attribObj.type = 'esriFieldTypeString';
                        }
                        else if (typeof attributes[key] === 'number') {
                            attribObj.type = 'esriFieldTypeDouble';
                        }
                        dataObj.push(attribObj);
                    };
                    // fake the array of objects containing attribute name, domain, type and alias
                    // this array - 'dataObj' is consumed by attributesToDetails
                    for (var key in attributes) {
                        _loop_1(key);
                    }
                    // fake the details object that is used by identify, so that the details panel is opened
                    var detailsObj = {
                        isLoading: false,
                        data: [{
                                name: proxy.getFeatureName(oid, attributes),
                                data: proxy.attributesToDetails(attributes, dataObj),
                                oid: attributes[proxy.oidField],
                                symbology: [{ svgcode: symbology }]
                            }],
                        requestId: -1,
                        requester: {
                            proxy: proxy
                        }
                    };
                    var details = {
                        data: [detailsObj]
                    };
                    map.toggleDetailsPanel(details);
                });
            };
            // determine if any column filters are present
            this.zoomToFeature = function (oid) {
                var map = that.mapApi.mapI;
                //set appropriate offset for point before zooming
                var offset = (that.panelManager.maximized || that.panelManager.isMobile()) ? { x: 0, y: 0 } : { x: 0.10416666666666667, y: 0.24464094319399785 };
                map.zoomToFeature(proxy, oid, offset);
            };
        });
    };
    return DetailsAndZoomButtons;
}());
exports.DetailsAndZoomButtons = DetailsAndZoomButtons;
