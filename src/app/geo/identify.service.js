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

    function identifyService(stateManager, $q) {

        const dynamicLayers = [];
        const featureLayers = [];

        return (geoApi, map, layerRegistry) => {
            geoApi.events.wrapEvents(map, { click: clickHandlerBuilder(geoApi, map, layerRegistry) });

            return {
                /**
                 * Add a dynamic layer to identify when map click events happen.
                 * @param {Object} layer an ESRI ArcGISDynamicMapServiceLayer object
                 * @param {String} name the display name of the layer
                 */
                addDynamicLayer: (layer, name) => dynamicLayers.push({ layer, name }),

                /**
                 * Add a feature layer to identify when map click events happen.
                 * @param {Object} layer an ESRI FeatureLayer object
                 * @param {String} name the display name of the layer
                 */
                addFeatureLayer: (layer, name) => featureLayers.push({ layer, name })

            };
        };

        /******/

        // returns the number of visible layers that have been registered with the identify service
        function getVisibleLayers() {
            // use .filter to count boolean true values
            return dynamicLayers.concat(featureLayers).filter(l => l.layer.visibleAtMapScale).length;
        }

        // takes an attribute set (key-value mapping) and converts it to a format
        // suitable for the details pane.
        // TODO make this extensible / modifiable / configurable to allow different details looks for different data
        function attributesToDetails(attribs) {
            // simple array of text mapping for demonstration purposes. fancy grid formatting later?
            return Object.keys(attribs).map(key =>
                `make a table row from ${key} and ${attribs[key]}`);
        }

        // extract the feature name from a feature as best we can.
        // takes feature attribute set, layer state, and object id
        function getFeatureName(attribs, state, objId) {
            // FIXME : display field is not yet defined in the config schema.  in particular, we need to account
            //        for different name fields in child-layers of dynamic layers.
            //        may be easier to just store the display field from the server when we download attributes,
            //        though this would not allow us to override the server-defined field in the config.
            if (state.displayField) {
                // until schema & approach is finalized, this will never run
                return attribs[state.displayField];
            } else {
                // FIXME wire in "feature" to translation service
                return 'Feature ' + objId;
            }
        }

        // will make an extent around a point, that is appropriate for the current map scale.
        // makes it easier for point clicks to instersect
        // the tolerance is distance in pixels from mouse point that qualifies as a hit
        function makeClickBuffer(point, geoApi, map, tolerance = 5) {
            // take pixel tolerance, convert to map units at current scale. x2 to turn radius into diameter
            const buffSize = 2 * tolerance * map.extent.getWidth() / map.width;

            // Build tolerance envelope of correct size
            const cBuff = new geoApi.mapManager.Extent(1, 1, buffSize, buffSize, point.spatialReference);

            // move the envelope so it is centered around the point
            return cBuff.centerAt(point);
        }

        // attempt to get a tolerance from the layer state, otherwise return a default
        function getTolerance(layerRegistry, layer) {
            if (layerRegistry[layer.id] && layerRegistry[layer.id].state && layerRegistry[layer.id].state.tolerance) {
                return layerRegistry[layer.id].state.tolerance;
            } else {
                return 5;
            }
        }

        function clickHandlerBuilder(geoApi, map, layerRegistry) {

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
                let idPromises = dynamicLayers.map(({ layer, name }) => {
                    if (!layer.visibleAtMapScale) {
                        return $q.resolve(null);
                    }

                    const result = {
                        isLoading: true,
                        requestId: -1,
                        requester: name,
                        data: []
                    };
                    opts.tolerance = getTolerance(layerRegistry, layer);
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
                idPromises = idPromises.concat(featureLayers.map(({ layer, name }) => {

                    if (!layer.visibleAtMapScale) {
                        return $q.resolve(null);
                    }

                    const result = {
                        isLoading: true,
                        requestId: -1,
                        requester: name,
                        data: []
                    };
                    details.data.push(result);

                    // run a spatial query
                    const qry = new geoApi.layer.Query();
                    qry.outFields = ['*']; // this will result in just objectid fields, as that is all we have in feature layers
                    qry.geometry = makeClickBuffer(clickEvent.mapPoint, geoApi, map,
                        getTolerance(layerRegistry, layer));

                    return $q((resolve, reject) => {
                        // queryFeatures returns a dojo-style promise, so cannot use .catch
                        layer.queryFeatures(qry).then(queryResult => {

                            // transform attributes of query results into {name,data} objects
                            // one object per queried feature
                            //
                            // each feature will have its attributes converted into a table
                            // placeholder for now until we figure out how to signal the panel that
                            // we want to make a nice table
                            result.data = queryResult.features.map(feat => {
                                // TODO might want to abstract some of this out into a "get attibutes from feature" function
                                // get the id and attribute bundle of the layer belonging to the feature that was clicked
                                if (!layerRegistry[layer.id]) {
                                    throw new Error('Click on unregistered layer ' + layer.id);
                                }

                                const attribsBundle = layerRegistry[layer.id].attribs;
                                if (!attribsBundle) {
                                    // a valid case is that attributes are still downloading. perhaps returning
                                    // a "click back later when attribs have downloaded" detail result is ok?
                                    // for now, just display the bare data that is in the graphic layer (probably object id)
                                    // FIXME once we have a promise that resolves after attributes are downloaded,
                                    //      use that to delay this entire attribute fetch process
                                    return {
                                        name: feat.getTitle(),
                                        data: attributesToDetails(feat.attributes)
                                    };
                                } else if (Object.keys(attribsBundle).length === 0) {
                                    // TODO do we really want to error, or just do nothing (i.e. user clicks on no-data feature -- so what?)
                                    throw new Error('Click on layer without downloaded attributes ' + layer.id);
                                }

                                const layerState = layerRegistry[layer.id].state;

                                // feature layers have only one index, so the first one is ours. grab the attribute set for that index.
                                const attribSet = attribsBundle[attribsBundle.indexes[0]];

                                // grab the object id of the feature we clicked on.
                                const objId = feat.attributes[attribSet.oidField].toString();

                                // use object id find location of our feature in the feature array, and grab its attributes
                                const featAttribs = attribSet.features[attribSet.oidIndex[objId]].attributes;

                                return {
                                    name: getFeatureName(feat.attribs, layerState, objId),
                                    data: attributesToDetails(featAttribs)
                                };
                            });
                            result.isLoading = false;
                            resolve(true);

                        }, err => {
                            console.warn('Layer query failed');
                            console.warn(err);
                            result.data = JSON.stringify(err);
                            result.isLoading = false;
                            reject(err);
                        });
                    });

                }));

                details.isLoaded = $q.all(idPromises).then(() => true);

                stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
            };
        }

    }
})();
