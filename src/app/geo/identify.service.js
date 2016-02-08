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
                addDynamicLayer: (layer, name) => { dynamicLayers.push({ layer, name }); }
            };
        };

        ////////

        function clickHandlerBuilder(geoApi, map) {
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
                            result.data = clickResults.map((ele, idx) => {
                                return {
                                    name: ele.value,
                                    data: Object.keys(ele.feature.attributes).map( key =>
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
