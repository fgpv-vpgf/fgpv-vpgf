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
        .factory('identifyService', identifyServiceFactory);

    function identifyServiceFactory($q, gapiService, stateManager, layerTypes) {
        return geoState => identifyService(
            geoState,
            geoState.mapService.mapObject,
            geoState.layerRegistry
        );

        function identifyService(geoState, mapObject, layerRegistry) {

            return init();

            /***/

            /**
             * Initializes identify service. This needs to be called everytime the map is created.
             */
            function init() {
                gapiService.gapi.events.wrapEvents(
                    mapObject, {
                        click: clickHandlerBuilder(mapObject)
                    });

                return null;
            }

            /******/

            // returns the number of visible layers that have been registered with the identify service
            function getVisibleLayers() {
                // use .filter to count boolean true values
                // TODO: make nicer
                console.info(layerRegistry.getLayersByType(layerTypes.esriFeature));
                return layerRegistry.getLayersByType(layerTypes.esriFeature)
                    .concat(layerRegistry.getLayersByType(layerTypes.esriDynamic))
                    .filter(l => l.layer.visibleAtMapScale)
                    .concat(layerRegistry.getLayersByType(layerTypes.ogcWms))
                    .length;
            }

            // takes an attribute set (key-value mapping) and converts it to a format
            // suitable for the details pane.
            // the fields param is optional field information containing alias data
            // TODO make this extensible / modifiable / configurable to allow different details looks for different data
            function attributesToDetails(attribs, fields) {
                // simple array of text mapping for demonstration purposes. fancy grid formatting later?

                return Object.keys(attribs)
                    .map(key => {
                        let fieldName = layerRegistry.aliasedFieldName(key, fields);

                        return {
                            key: fieldName,
                            value: attribs[key]
                        };
                    });
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
            function makeClickBuffer(point, map, tolerance = 5) {
                // take pixel tolerance, convert to map units at current scale. x2 to turn radius into diameter
                const buffSize = 2 * tolerance * map.extent.getWidth() / map.width;

                // Build tolerance envelope of correct size
                const cBuff = new gapiService.gapi.mapManager.Extent(1, 1, buffSize, buffSize, point.spatialReference);

                // move the envelope so it is centered around the point
                return cBuff.centerAt(point);
            }

            // attempt to get a tolerance from the layer state, otherwise return a default
            function getTolerance(layer) {
                if (layerRegistry.layers[layer.id] && layerRegistry.layers[layer.id].state &&
                    layerRegistry.layers[layer.id].state.tolerance) {
                    return layerRegistry.layers[layer.id].state.tolerance;
                } else {
                    return 5;
                }
            }

            function identifyDynamicLayer(layer, state, opts, panelData) {
                if (!layer.visibleAtMapScale) {
                    return $q.resolve(null);
                }

                const subResults = {};

                // every dynamic layer is a group in toc; walk its items to create an entry in details panel
                state.walkItems(subItem => {
                    const index = state.slaves.indexOf(subItem); // get real index of the sublayer; needed to match with `layerId` from clickResults
                    const result = {
                        isLoading: true,
                        requestId: -1,
                        requester: {
                            symbology: subItem.symbology,
                            name: subItem.name,
                            caption: state.name,
                            format: 'EsriFeature'
                        },
                        data: []
                    };
                    subResults[index] = result;
                    panelData.push(result);
                });

                opts.tolerance = getTolerance(layer);
                return gapiService.gapi.layer.serverLayerIdentify(layer, opts)
                    .then(clickResults => {
                        console.log('got a click result');
                        console.log(clickResults);

                        // transform attributes of click results into {name,data} objects
                        // one object per identified feature
                        //
                        // each feature will have its attributes converted into a table
                        // placeholder for now until we figure out how to signal the panel that
                        // we want to make a nice table
                        clickResults.forEach(ele => {
                            // NOTE: the identify service returns aliased field names, so no need to look them up here
                            const subResult = subResults[ele.layerId];
                            subResult.data.push({
                                name: ele.value,
                                data: attributesToDetails(ele.feature.attributes)
                            });
                            subResult.isLoading = false;
                        });
                        // set the rest of the entries to loading false
                        Object.entries(subResults).forEach(([key, value]) => {
                            if (value.isLoading) {
                                value.isLoading = false;
                                value.data = []; // no data items
                            }
                        });
                    })
                    .catch(err => {
                        console.warn('Identify failed');
                        console.warn(err);

                        Object.entries(subResults).forEach(([key, value]) => {
                            value.isLoading = false;
                            value.data = null;
                            value.error = JSON.stringify(err);
                        });
                    });

            }

            function identifyWmsLayer(layer, state, clickEvent, panelData) {
                const result = {
                    isLoading: true,
                    requestId: -1,
                    requester: {
                        name: state.name,
                        format: 'Text'
                    },
                    data: []
                };
                panelData.push(result);

                return gapiService.gapi.layer.ogc
                    .getFeatureInfo(layer, clickEvent, state.layerEntries.map(le => le.id), 'text/plain')
                    .then(data => {
                        result.isLoading = false;
                        result.data.push(data);
                        console.info(data);
                    });
            }

            function identifyFeatureLayer(layer, state, clickEvent, map, panelData) {
                if (!layer.visibleAtMapScale) {
                    return $q.resolve(null);
                }

                // FIXME  add a check to see if layer has config setting for not supporting a click

                const result = {
                    isLoading: true,
                    requestId: -1,
                    requester: {
                        name: state.name,
                        symbology: state.symbology,
                        format: 'EsriFeature'
                    },
                    data: []
                };
                panelData.push(result);

                // run a spatial query
                const qry = new gapiService.gapi.layer.Query();
                qry.outFields = ['*']; // this will result in just objectid fields, as that is all we have in feature layers
                qry.geometry = makeClickBuffer(clickEvent.mapPoint, map, getTolerance(layer));

                return $q((resolve, reject) => {

                    // TODO might want to abstract some of this out into a "get attibutes from feature" function
                    // get the id and attribute bundle of the layer belonging to the feature that was clicked
                    if (!layerRegistry.layers[layer.id]) {
                        throw new Error('Click on unregistered layer ' + layer.id);
                    }
                    const layerState = layerRegistry.layers[layer.id].state;

                    // ensure attributes are downloaded.  wait for them if not.
                    layerRegistry.layers[layer.id].attribs.then(attribsBundle => {

                        if (attribsBundle.indexes.length === 0) {
                            // TODO do we really want to error, or just do nothing (i.e. user clicks on no-data feature -- so what?)
                            throw new Error(`Click on layer without downloaded attributes ${layer.id}`);
                        }

                        // feature layers have only one index, so the first one is ours. grab the attribute set for that index.
                        const attribSet = attribsBundle[attribsBundle.indexes[0]];

                        // queryFeatures returns a dojo-style promise, so cannot use .catch
                        $q.resolve(layer.queryFeatures(qry))
                            .then(queryResult => {
                                // transform attributes of query results into {name,data} objects
                                // one object per queried feature
                                //
                                // each feature will have its attributes converted into a table
                                // placeholder for now until we figure out how to signal the panel that
                                // we want to make a nice table
                                result.data = queryResult.features.map(
                                    feat => {

                                        // grab the object id of the feature we clicked on.
                                        const objId = feat.attributes[attribSet.oidField].toString();

                                        // use object id find location of our feature in the feature array, and grab its attributes
                                        const featAttribs = attribSet.features[attribSet.oidIndex[objId]].attributes;

                                        return {
                                            name: getFeatureName(feat.attribs, layerState, objId),
                                            data: attributesToDetails(featAttribs, attribSet.fields)
                                        };
                                    });
                                result.isLoading = false;
                                resolve(true);
                            })
                            .catch(err => {
                                console.warn('Layer query failed');
                                console.warn(err);
                                result.data = JSON.stringify(err);
                                result.isLoading = false;
                                reject(err);
                            });
                    });
                });
            }

            function clickHandlerBuilder(map) {

                /**
                 * Handles global map clicks.  Currently configured to walk through all registered dynamic
                 * layers and trigger service side identify queries, and perform client side spatial queries
                 * on registered feature layers.
                 * @name clickHandler
                 * @param {Object} clickEvent an ESRI event object for map click events
                 */
                return clickEvent => {
                    if (getVisibleLayers() === 0) {
                        return;
                    }

                    console.info('Click start');
                    const details = {
                        data: []
                    };

                    const opts = {
                        geometry: clickEvent.mapPoint,
                        width: map.width,
                        height: map.height,
                        mapExtent: map.extent,
                    };

                    // run through all registered dynamic layers and trigger
                    // an identify task for each layer
                    const dynmaicPromises = layerRegistry
                        .getLayersByType(layerTypes.esriDynamic)
                        .map(item => identifyDynamicLayer(item.layer, item.state, opts, details.data));

                    const wmsPromises = layerRegistry
                        .getLayersByType(layerTypes.ogcWms)
                        .map(item => identifyWmsLayer(item.layer, item.state, clickEvent, details.data));

                    const featurePromises = layerRegistry
                        .getLayersByType(layerTypes.esriFeature)
                        .map(item => identifyFeatureLayer(item.layer, item.state, clickEvent, map, details.data));

                    let idPromises = [];
                    idPromises = idPromises.concat(dynmaicPromises);
                    idPromises = idPromises.concat(wmsPromises);
                    idPromises = idPromises.concat(featurePromises);

                    details.isLoaded = $q.all(idPromises).then(() => true);

                    stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
                };
            }
        }
    }
})();
