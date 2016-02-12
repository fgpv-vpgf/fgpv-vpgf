(() => {
    /**
     * @ngdoc service
     * @name identifyService
     * @module app.geo
     *
     * @description
     * Generates handlers for feature identification on all layer types.
     */
    angular
        .module('app.geo')
        .factory('identifyService', identifyService);

    function identifyService(stateManager) {

        const dynamicLayers = [];
        const featureLayers = [];

        return (geoApi, map) => {
            geoApi.events.wrapEvents(map, { click: clickHandlerBuilder(geoApi, map) });

            return {
                /**
                 * Add a dynamic layer to identify when map click events happen.
                 * @param {Object} layer an ESRI ArcGISDynamicMapServiceLayer object
                 * @param {String} name the display name of the layer
                 */
                addDynamicLayer: (layer, name) => { dynamicLayers.push({ layer, name }); },

                /**
                 * Add a feature layer to identify when map click events happen.
                 * @param {Object} layer an ESRI FeatureLayer object
                 * @param {String} name the display name of the layer
                 */
                addFeatureLayer: (layer, name) => { featureLayers.push({ layer, name }); }

            };
        };

        ////////

        //returns the number of visible layers that have been registered with the identify service
        function getVisibleLayers() {
            let count = 0;
            dynamicLayers.concat(featureLayers).forEach(layerReg => {
                count += layerReg.layer.visibleAtMapScale ? 1 : 0;
            });
            return count;
        }

        //takes an attribute set (key-value mapping) and converts it to a format
        //suitable for the details pane.
        //TODO make this extensible / modifiable / configurable to allow different details looks for different data
        function attributesToDetails(attribs) {
            //simple array of text mapping for demonstration purposes. fancy grid formatting later?
            return Object.keys(attribs).map(key =>
                `make a table row from ${key} and ${attribs[key]}`);
        }

        function clickHandlerBuilder(geoApi, map) {

            /**
             * Handles global map clicks.  Currently configured to walk through all registered dynamic
             * layers and trigger service side identify queries, and perform client side spatial queries
             * on registered feature layers.  TODO: add WMS support
             * @name clickHandler
             * @param {Object} clickEvent an ESRI event object for map click events
             */
            return clickEvent => {
                if (getVisibleLayers() === 0) { return; }

                console.info('Click start');
                const details = { data: [] };

                const opts = {
                    geometry: clickEvent.mapPoint,
                    width: map.width,
                    height: map.height,
                    mapExtent: map.extent,
                };

                // run through all registered dynamic layers and trigger
                // an identify task for each layer
                const idPromises = dynamicLayers.map(({ layer, name }) => {
                    if (!layer.visibleAtMapScale) {
                        return Promise.resolve(null);
                    }

                    const result = {
                        isLoading: true,
                        requestId: -1,
                        requester: name,
                        data: []
                    };
                    details.data.push(result);
                    return geoApi.layer.serverLayerIdentify(layer, opts)
                        .then(clickResults => {
                            console.log('got a click result');
                            console.log(clickResults);

                            // transform attributes of click results into {name,data} objects
                            // one object per identified feature
                            //
                            // each feature will have its attributes converted into a table
                            // placeholder for now until we figure out how to signal the panel that
                            // we want to make a nice table
                            result.data = clickResults.map(ele => {
                                return {
                                    name: ele.value,
                                    data: attributesToDetails(ele.feature.attributes)
                                };
                            });
                            result.isLoading = false;
                            console.log(details);
                        })
                        .catch(err => {
                            console.warn('Identify failed');
                            console.warn(err);
                            result.data = JSON.stringify(err);
                            result.isLoading = false;
                        });
                });

                // run through all registered feature layers and trigger
                // an spatial query for each layer
                Array.prototype.push.apply(idPromises, featureLayers.map(({ layer, name }) => {
                    if (!layer.visibleAtMapScale) {
                        return Promise.resolve(null);
                    }

                    const result = {
                        isLoading: true,
                        requestId: -1,
                        requester: name,
                        data: []
                    };
                    details.data.push(result);

                    //run a spatial query

                    const qry = new geoApi.layer.Query();
                    qry.outFields = ['*']; //this will result in just objectid fields, as that is all we have in feature layers
                    qry.geometry = clickEvent.mapPoint;

                    //TODO tolerance?

                    return layer.queryFeatures(qry).then(queryResult => {

                        // transform attributes of query results into {name,data} objects
                        // one object per queried feature
                        //
                        // each feature will have its attributes converted into a table
                        // placeholder for now until we figure out how to signal the panel that
                        // we want to make a nice table
                        result.data = queryResult.features.map(feat => {
                            return {
                                name: feat.getTitle(), //getFeatureName(feat.attribs, layerState, objId),
                                data: attributesToDetails(feat.attributes)
                            };
                        });
                        result.isLoading = false;

                    })
                    .catch(err => {
                        console.warn('Layer query failed');
                        console.warn(err);
                        result.data = JSON.stringify(err);
                        result.isLoading = false;
                    });

                }));

                details.isLoaded = Promise.all(idPromises).then(() => true);

                stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
            };
        }

    }
})();
