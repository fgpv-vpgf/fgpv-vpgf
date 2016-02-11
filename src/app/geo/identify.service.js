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
        let lastClick = Date.now(); //HACK time to deterimne when to clear content

        return (geoApi, map, layerRegistry) => {
            geoApi.events.wrapEvents(map, { click: clickHandlerBuilder(geoApi, map) });

            return {
                /**
                 * Add a dynamic layer to identify when map click events happen.
                 * @param {Object} layer an ESRI DynamicLayer object
                 * @param {String} name the display name of the layer
                 */
                addDynamicLayer: (layer, name) => { dynamicLayers.push({ layer, name }); },
                featureClickHandler: featureClickHandlerBuilder(layerRegistry)
            };
        };

        ////////

        //determines if it has been sufficiently long since the last user click happened.
        //used by competing handlers to determine if they should clear the results pane
        //or just append data to it
        function newClickTest() {
            const rightNow = Date.now();
            if (rightNow - lastClick > 500) {
                //has been half a second since last click.  treat as new click
                lastClick = rightNow;
                return true;
            } else {
                //less than half a second. was probably the same click
                return false;
            }
        }

        //takes an attribute set (key-value mapping) and converts it to a format
        //suitable for the details pane.
        //TODO make this extensible / modifiable / configurable to allow different details looks for different data
        function attributesToDetails(attribs) {
            //simple array of text mapping for demonstration purposes. fancy grid formatting later?
            return Object.keys(attribs).map(key =>
                `make a table row from ${key} and ${attribs[key]}`);
        }

        //extract the feature name from a feature as best we can.
        //takes feature attribute set, layer state, and object id
        function getFeatureName(attribs, state, objId) {
            //FIXME : display field is not yet defined in the config schema.  in particular, we need to account
            //        for different name fields in child-layers of dynamic layers.
            //        may be easier to just store the display field from the server when we download attributes,
            //        though this would not allow us to override the server-defined field in the config.
            if (state.displayField) {
                //until schema & approach is finalized, this will never run
                return attribs[state.displayField];
            } else {
                //FIXME wire in "feature" to translation service
                return 'Feature ' + objId;
            }
        }

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

                details.isLoaded = Promise.all(idPromises).then(() => true);

                stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
            };
        }

        function featureClickHandlerBuilder(layerRegistry) {

            //TODO the map click is also happening, which conflicts with this.
            //     as well as consider other actual feature-layer items that are underneath the top
            //     feature.  This can include file-based features, meaning we cannot default to
            //     just using server-side identify to solve the issue.  A true mess.

            /**
             * Handles clicks on features (belonging to feature layers). Takes clicked
             * item and fetches the attributes from attribute store (local operation).
             * Formats the attribute data for details pane and loads the pane
             * @name featureClickHandler
             * @param {Object} clickEvent an ESRI event object for feature layer click events
             */
            return clickEvent => {

                //TODO we have duplicated code in both click handlers to manage the details pane.  abstract if possible
                const detailsPanel = stateManager.display.details;
                detailsPanel.isLoading = true;
                if (newClickTest()) {
                    detailsPanel.data = [];
                }

                //get the id and attribute bundle of the layer belonging to the feature that was clicked
                const layerId = clickEvent.graphic.getLayer().id;
                if (!layerRegistry[layerId]) {
                    throw new Error('Click on unregistered layer ' + layerId);
                }

                const attribsBundle = layerRegistry[layerId].attribs;
                if (!attribsBundle) {
                    //TODO a valid case is that attributes are still downloading. perhaps returning
                    //     a "click back later when attribs have downloaded" detail result is ok?
                    detailsPanel.isLoading = false;
                    return;
                } else if (attribsBundle === {}) {
                    //TODO do we really want to error, or just do nothing (i.e. user clicks on no-data feature -- so what?)
                    throw new Error('Click on layer without downloaded attributes ' + layerId);
                }

                const layerState = layerRegistry[layerId].state;

                //feature layers have only one index, so the first one is ours. grab the attribute set for that index.
                const attribSet = attribsBundle[attribsBundle.indexes[0]];

                //grab the object id of the feature we clicked on.
                const objId = clickEvent.graphic.attributes[attribSet.oidField].toString();

                //use object id find location of our feature in the feature array, and grab its attributes
                const featAttribs = attribSet.features[attribSet.oidIndex[objId]].attributes;

                //construct a details result and plop it on the panel
                const result = {
                    isLoading: false, //synchronous load
                    requestId: -1, //TODO verify what this is and if -1 is appropriate
                    requester: layerState.name || '',
                    data: [{
                        name: getFeatureName(featAttribs, layerState, objId),
                        data: attributesToDetails(featAttribs)
                    }]
                };
                detailsPanel.data.push(result);
                detailsPanel.isLoading = false;

                //FIXME this is not a perfect solution; it only works right now because we have non-feature layers always present.
                //      need a good way to know when to show/hide the point window.  having this line in both handlers makes it open
                //      then close.
                //stateManager.setActive({ side: false }, 'mainDetails');
            };
        }

    }
})();
