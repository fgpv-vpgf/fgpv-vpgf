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

        return (geoApi, map) => {
            geoApi.events.wrapEvents(map, { click: clickHandlerBuilder(geoApi, map) });

            return {
                /**
                 * Add a dynamic layer to identify when map click events happen.
                 * @param {Object} layer an ESRI DynamicLayer object
                 * @param {String} name the display name of the layer
                 */
                addDynamicLayer: (layer, name) => { dynamicLayers.push({ layer, name }); }
            };
        };

        ////////

        function clickHandlerBuilder(geoApi, map) {

            /**
             * Handles global map clicks.  Currently configured to walk through all registered dynamic
             * layers and trigger service side identify queries.  TODO: add WMS support
             * @name clickHandler
             * @param {Object} clickEvent an ESRI event object for map click events
             */
            return clickEvent => {
                if (dynamicLayers.length === 0) { return; }

                console.info('Click start');
                const detailsPanel = stateManager.display.details;
                detailsPanel.isLoading = true;
                detailsPanel.data = [];

                const opts = {
                    geometry: clickEvent.mapPoint,
                    width: map.width,
                    height: map.height,
                    mapExtent: map.extent,
                };

                // run through all registered dynamic layers and trigger
                // an identify task for each layer
                const idPromises = dynamicLayers.map(({ layer, name }) => {
                    const result = {
                        isLoading: true,
                        requestId: -1,
                        requester: name,
                        data: []
                    };
                    detailsPanel.data.push(result);
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
                                    data: Object.keys(ele.feature.attributes).map(key =>
                                        `make a table row from ${key} and ${ele.feature.attributes[key]}`
                                    )
                                };
                            });
                            result.isLoading = false;
                        })
                        .catch(err => {
                            console.warn('Identify failed');
                            console.warn(err);
                            result.data = JSON.stringify(err);
                            result.isLoading = false;
                        });
                });

                Promise.all(idPromises)
                    .then(() => { detailsPanel.isLoading = false; })
                    .catch(() => { detailsPanel.isLoading = false; });

                stateManager.setActive({ side: false }, 'mainDetails');
            };
        }

    }
})();
