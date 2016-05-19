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

    function identifyServiceFactory($q, gapiService, stateManager, Geo) {
        return geoState => identifyService(
            geoState,
            geoState.mapService.mapObject,
            geoState.layerRegistry
        );

        function identifyService(geoState, mapObject, layerRegistry) {

            // identify handler switch
            const identifyHandlers = {
                esriFeature: identifyEsriFeatureLayer,
                esriDynamic: identifyEsriDynamicLayer,
                ogcWms: identifyOgcWmsLayer
            };

            // jscs doesn't like enhanced object notation
            // jscs:disable requireSpacesInAnonymousFunctionExpression
            /**
             * Create an identify result object.
             * @param  {String} name      layer name of the queried layer
             * @param  {Array} symbology array of layer symbology to be displayed in details panel
             * @param  {String} format    indicates data formating template
             * @param  {String} caption   optional captions to be displayed along with the name
             * @return {Object}           identify result object
             */
            const IDENTIFY_RESULT = (name, symbology, format, caption) => {
                return {
                    isLoading: true,
                    requestId: -1,
                    requester: {
                        name,
                        symbology,
                        format,
                        caption
                    },
                    data: []
                };
            };
            // jscs:enable requireSpacesInAnonymousFunctionExpression

            return init();

            /***/

            /**
             * Initializes identify service. This needs to be called everytime the map is created.
             */
            function init() {
                gapiService.gapi.events.wrapEvents(
                    mapObject,
                    {
                        click: clickHandlerBuilder
                    }
                );

                return {
                    getFeatureName,
                    attributesToDetails
                };
            }

            /******/

            // returns the number of visible layers that have been registered with the identify service
            function getVisibleLayers() {
                // use .filter to count boolean true values
                // TODO: make nicer
                return layerRegistry.getLayersByType(Geo.Layer.Types.ESRI_FEATURE)
                    .concat(layerRegistry.getLayersByType(Geo.Layer.Types.ESRI_DYNAMIC))
                    .filter(l => l.layer.visibleAtMapScale)
                    .concat(layerRegistry.getLayersByType(Geo.Layer.Types.OGC_WMS))
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
                        let val = attribs[key];

                        if (layerRegistry.checkDateType(key, fields) && val.length > 10) {
                            const date = new Date(val);
                            val = date.toISOString().substring(0, 10);
                        }

                        return {
                            key: fieldName,
                            value: val
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

            /**
            * Run a query on a dynamic layer, return the result as a promise.
            * @param {Object} layerRecord esri layer object
            * @param {Object} opts additional argumets like map object, clickEvent, etc.
            * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
            */
            function identifyEsriDynamicLayer(layerRecord, opts) {
                const { layer, state } = layerRecord;

                // ignore invisible layers by returning empty object
                if (!layer.visibleAtMapScale || !layer.visible) {
                    return {};
                }

                const identifyResults = [];

                // every dynamic layer is a group in toc; walk its items to create an entry in details panel
                state.walkItems(legendEntry => {

                    // ignore invisible sublayers and those where query option is false by returning empty object
                    if (!legendEntry.getVisibility() || !legendEntry.options.query.value) {
                        return;
                    }

                    const identifyResult =
                        IDENTIFY_RESULT(legendEntry.name, legendEntry.symbology, 'EsriFeature', state.name);

                    identifyResults[legendEntry.featureIdx] = identifyResult;
                });

                opts.tolerance = getTolerance(layer);

                const identifyPromise = gapiService.gapi.layer.serverLayerIdentify(layer, opts)
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
                            const identifyResult = identifyResults[ele.layerId];
                            identifyResult.data.push({
                                name: ele.value,
                                data: attributesToDetails(ele.feature.attributes)
                            });
                            identifyResult.isLoading = false;
                        });

                        // set the rest of the entries to loading false
                        identifyResults.forEach(identifyResult =>
                                identifyResult.isLoading = false);
                    });

                return {
                    identifyResults: identifyResults.filter(identifyResult => identifyResult), // collapse sparse array
                    identifyPromise
                };
            }

            /**
            * Run a getFeatureInfo on a WMS layer, return the result as a promise.  Fills the panelData array on resolution.
            * @param {Object} layerRecord esri layer object
            * @param {Object} opts additional argumets like map object, clickEvent, etc.
            * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
            */
            function identifyOgcWmsLayer(layerRecord, opts) {
                const { layer, state } = layerRecord;
                const infoMap = Geo.Layer.Ogc.INFO_FORMAT_MAP;

                // ignore layers with no mime type or invisible layers and those where query option is false by returning empty object
                if (!infoMap.hasOwnProperty(state.featureInfoMimeType) ||
                    !layer.visible ||
                    !state.options.query.value) {
                    return {};
                }

                const identifyResult =
                    IDENTIFY_RESULT(state.name, state.symbology, infoMap[state.featureInfoMimeType]);

                const identifyPromise = gapiService.gapi.layer.ogc
                    .getFeatureInfo(
                        layer,
                        opts.clickEvent,
                        state.layerEntries.map(le => le.id),
                        state.featureInfoMimeType)
                    .then(data => {
                        identifyResult.isLoading = false;
                        identifyResult.data.push(data);

                        // console.info(data);
                    });

                return { identifyResults: [identifyResult], identifyPromise };
            }

            /**
            * Run a query on a feature layer, return the result as a promise.  Fills the panelData array on resolution.
            * @param {Object} layerRecord esri layer object
            * @param {Object} opts additional argumets like map object, clickEvent, etc.
            * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
            */
            function identifyEsriFeatureLayer(layerRecord, opts) {
                const { layer, state } = layerRecord;

                // ignore invisible layers and those where identify option is false by returning empty object
                if (!layer.visibleAtMapScale || !layer.visible || !state.options.query.value) {
                    return {};
                }

                const identifyResult =
                    IDENTIFY_RESULT(state.name, state.symbology, 'EsriFeature');

                // run a spatial query
                const qry = new gapiService.gapi.layer.Query();
                qry.outFields = ['*']; // this will result in just objectid fields, as that is all we have in feature layers

                // more accurate results without making the buffer if we're dealing with extents
                if (layer.geometryType === 'esriGeometryPolygon') {
                    qry.geometry = opts.geometry;
                } else {
                    qry.geometry = makeClickBuffer(opts.clickEvent.mapPoint, opts.map, getTolerance(layer));
                }

                // no need to check if the layer is registered as this object comes from an array of registered layers
                const identifyPromise = $q.all([
                        layerRecord.getAttributes(state.featureIdx),
                        $q.resolve(layer.queryFeatures(qry))
                    ])
                    .then(([attributes, queryResult]) => {
                        // transform attributes of query results into {name,data} objects one object per queried feature
                        //
                        // each feature will have its attributes converted into a table
                        // placeholder for now until we figure out how to signal the panel that
                        // we want to make a nice table
                        identifyResult.isLoading = false;
                        identifyResult.data = queryResult.features.map(
                            feat => {
                                // grab the object id of the feature we clicked on.
                                const objId = feat.attributes[attributes.oidField].toString();

                                // use object id find location of our feature in the feature array, and grab its attributes
                                const featAttribs = attributes.rows[attributes.oidIndex[objId]];

                                return {
                                    name: getFeatureName(featAttribs, state, objId),
                                    data: attributesToDetails(featAttribs, attributes.fields)
                                };
                            });
                    });

                return { identifyResults: [identifyResult], identifyPromise };
            }

            /**
             * Modifies identify promises to always resolve, never reject
             * any errors caught will be added to the details data object
             * resolutions of these promises are for turning off loading indicator
             *
             * @param  {Promise} promise [description]
             * @return {Promise}                 promise that doesn't reject
             */
            function makeInfalliblePromise(promise) {
                const modifiedPromise = $q(resolve =>
                    promise
                        .then(() => resolve(true))
                        .catch(() => resolve(true))
                );

                return modifiedPromise;
            }

            /**
             * Handles global map clicks.  Currently configured to walk through all registered dynamic
             * layers and trigger service side identify queries, and perform client side spatial queries
             * on registered feature layers.
             * @name clickHandler
             * @param {Object} clickEvent an ESRI event object for map click events
             */
            function clickHandlerBuilder(clickEvent) {
                if (getVisibleLayers() === 0) {
                    return;
                }

                console.info('Click start');

                const loadingPromises = [];
                const details = {
                    data: []
                };

                // TODO: mapObject is accessible from all function, there is no need to pass it as a parameter
                const opts = {
                    map: mapObject,
                    clickEvent,
                    geometry: clickEvent.mapPoint,
                    width: mapObject.width,
                    height: mapObject.height,
                    mapExtent: mapObject.extent,
                };

                layerRegistry
                    .getAllQueryableLayerRecords()
                    .forEach(layerRecord => {
                        const { identifyResults, identifyPromise } =
                            identifyHandlers[layerRecord.initialState.layerType](layerRecord, opts);

                        // identify function returns undefined is the layer is cannot be queries because it's not visible or for some other reason
                        if (typeof identifyResults === 'undefined') {
                            return;
                        }

                        // catch error on identify promises and store error messages to be shown in the details panel.
                        const loadingPromise = identifyPromise.catch(error => {
                            // add common error handling

                            console.warn(`Identify query failed for ${layerRecord.state.name}`);
                            console.warn(error);

                            identifyResults.forEach(identifyResult => {
                                // TODO: this outputs raw error message from the service
                                // we might want to replace it with more user-understandable messages
                                identifyResult.error = error.message;
                                identifyResult.isLoading = false;
                            });
                        });

                        const infallibleLoadingPromise = makeInfalliblePromise(loadingPromise);

                        details.data.push(...identifyResults);
                        loadingPromises.push(infallibleLoadingPromise);
                    });

                details.isLoaded = $q.all(loadingPromises).then(() => true);
                stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
            }
        }
    }
})();
