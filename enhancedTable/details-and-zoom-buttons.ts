/**
 * Creates and manages the details and and zoom buttons for all the rows of one panel instance.
 *
 * This class contains a custom angular controller to enable the opening of the details panel, and the zoom functionality.
 */
export class DetailsAndZoomButtons {

    constructor(panelManager: any) {
        this.panelManager = panelManager;
        this.mapApi = panelManager.mapApi;
        this.legendBlock = panelManager.legendBlock;
        this.currentTableLayer = panelManager.currentTableLayer;
        this.oidField = panelManager.currentTableLayer._layerProxy.oidField;
        this.setDetailsAndZoomButtons();
    }

    // registers the DetailsAndZoomCtrl
    setDetailsAndZoomButtons() {
        const that = this;
        this.mapApi.agControllerRegister('DetailsAndZoomCtrl', function () {
            let proxy = that.legendBlock.proxyWrapper.proxy;

            // opens the details panel corresponding to the row where the details button is found
            this.openDetails = function (oid) {
                let data = proxy.formattedAttributes.then(function (attribs) {
                    const attributes = attribs.rows.find(attrib => {
                        if (attrib[that.oidField] === oid) {
                            return attrib;
                        }
                    });

                    let symbology = attributes['rvSymbol'];
                    let dataObj = [];
                    const map = that.mapApi.mapI;

                    // fake the array of objects containing attribute name, domain, type and alias
                    // this array - 'dataObj' is consumed by attributesToDetails
                    for (let key in attributes) {
                        const fieldData = attribs.fields.find(r => r.name === key);
                        let attribObj = {
                            alias: that.currentTableLayer.attributeHeaders[key] ? that.currentTableLayer.attributeHeaders[key]['name'] : '',
                            clientAlias: (fieldData && fieldData.clientAlias) ? fieldData.clientAlias : undefined,
                            name: key,
                            domain: null,
                            type: null
                        }

                        // set the esriFieldType depending on the type of the value
                        if (key === proxy.oidField) {
                            attribObj.type = 'esriFieldTypeOID';
                        } else if (typeof attributes[key] === 'string') {
                            attribObj.type = 'esriFieldTypeString';
                        } else if (typeof attributes[key] === 'number') {
                            attribObj.type = 'esriFieldTypeDouble';
                        }

                        dataObj.push(attribObj);
                    }

                    // fake the details object that is used by identify, so that the details panel is opened
                    let detailsObj = {
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
                    }
                    let details = {
                        data: [detailsObj]
                    }

                    map.toggleDetailsPanel(details);
                });
            };

            // determine if any column filters are present
            this.zoomToFeature = function (oid) {
                const map = that.mapApi.mapI;
                //set appropriate offset for point before zooming
                let offset = (that.panelManager.maximized || that.panelManager.isMobile()) ? { x: 0, y: 0 } : { x: 0.10416666666666667, y: 0.24464094319399785 };
                map.zoomToFeature(proxy, oid, offset);
            };
        });
    }
}

export interface DetailsAndZoomButtons {
    panelManager: any;
    mapApi: any;
    legendBlock: any;
    currentTableLayer: any;
    oidField: any;
}
