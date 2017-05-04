/* global RV */
(() => {
    /**
     * @module identifyService
     * @memberof app.geo
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

            // TODO convert this object into an ES6 class
            // jscs doesn't like enhanced object notation
            // jscs:disable requireSpacesInAnonymousFunctionExpression
            /**
             * Create an identify result object.
             * FIXME make this a proper class
             * @constructor IDENTIFY_RESULT
             * @param  {String} name      layer name of the queried layer
             * @param  {Array} symbology array of layer symbology to be displayed in details panel
             * @param  {String} format    indicates data formating template
             * @param  {Object} layerRec  layer record for the queried layer
             * @param  {Integer} featureIdx  optional feature index of queried layer (should be provided for attribute based layers)
             * @param  {String} caption   optional captions to be displayed along with the name
             * @return {Object}           identify result object
             */
            const IDENTIFY_RESULT = (name, symbology, format, layerRec, featureIdx, caption) => {
                return {
                    isLoading: true,
                    requestId: -1,
                    requester: {
                        name,
                        symbology,
                        format,
                        caption,
                        layerRec,
                        featureIdx
                    },
                    data: []
                };
            };
            // jscs:enable requireSpacesInAnonymousFunctionExpression

            return init();

            /***/

            /**
             * Initializes identify service. This needs to be called everytime the map is created.
             * @function init
             * @private
             */
            function init() {
                const clickHandler = clickHandlerBuilder;
                gapiService.gapi.events.wrapEvents(
                    mapObject,
                    {
                        click: clickHandler
                    }
                );

                geoState.identifyService =  {
                    getFeatureName,
                    attributesToDetails,
                    clickHandler
                };

                return geoState.identifyService;
            }

            /******/

            // returns the number of visible layers that have been registered with the identify service
            function getVisibleLayers() {
                // use .filter to count boolean true values
                // TODO: make nicer
                return layerRegistry.getLayersByType(Geo.Layer.Types.ESRI_FEATURE)
                    .concat(layerRegistry.getLayersByType(Geo.Layer.Types.ESRI_DYNAMIC))
                    .filter(l => l.visibleAtMapScale)
                    .concat(layerRegistry.getLayersByType(Geo.Layer.Types.OGC_WMS))
                    .length;
            }

            /**
             * Transforms esri key-value attribute object into key value array with format suitable
             * for consumption by the details pane.
             *
             * @function attributesToDetails
             * @param  {Object} attribs      attribute key-value mapping, potentially with aliases as keys
             * @param  {Array} fields       optional. fields definition array for layer
             * @return {Array}               attribute data transformed into a list, with potential field aliasing applied
             */
            function attributesToDetails(attribs, fields) {
                // TODO make this extensible / modifiable / configurable to allow different details looks for different data
                // simple array of text mapping for demonstration purposes. fancy grid formatting later?
                return Object.keys(attribs)
                    .map(key => {
                        const fieldType = fields ? fields.find(f => f.name === key) : null;
                        return {
                            key: layerRegistry.aliasedFieldName(key, fields),
                            value: attribs[key],
                            type: fieldType ? fieldType.type : fieldType
                        };
                    });
            }

            /**
             * Convert an attribute set so that any keys using aliases are converted to proper fields
             * @function unAliasAttribs
             * @param  {Object} attribs      attribute key-value mapping, potentially with aliases as keys
             * @param  {Array} fields       fields definition array for layer
             * @return {Object}              attribute key-value mapping with fields as keys
             */
            function unAliasAttribs(attribs, fields) {
                const newA = {};
                fields.forEach(field => {
                    // attempt to extract on name. if not found, attempt to extract on alias
                    let val = attribs[field.name];
                    if (!val) {
                        val = attribs[field.alias];
                    }

                    // dump value into the result
                    newA[field.name] = val;
                });
                return newA;
            }

            /**
            * Extract the feature name from a feature as best we can.
            * Support for dynamic layers is limited at the moment.
            *
            * @function getFeatureName
            * @param {Object} attribs the dictionary of attributes for the feature
            * @param {Object} layerRec the record in the layer registry that the feature belongs to
            * @param {Integer} objId the object id of the attribute
            * @returns {String} the name of the feature
            */
            function getFeatureName(attribs, layerRec, objId) {
                // TODO :  we also need to determine if we will support name fields
                //         on child layers of Dynamic services. This would be relevant
                //         if we implement maptips, or need to override the name field
                //         in the details pane.

                let nameField = '';

                if (layerRec.legendEntry && layerRec.legendEntry.nameField) {
                    nameField = layerRec.legendEntry.nameField;
                } else if (layerRec._layer && layerRec._layer.displayField) {
                    nameField = layerRec._layer.displayField;
                }

                if (nameField) {
                    return attribs[nameField];
                } else {
                    // FIXME wire in "feature" to translation service
                    return 'Feature ' + objId;
                }
            }

            // will make an extent around a point, that is appropriate for the current map scale.
            // makes it easier for point clicks to instersect
            // the tolerance is distance in pixels from mouse point that qualifies as a hit
            // FIXME convert to jsdoc
            function makeClickBuffer(point, map, tolerance = 5) {
                // take pixel tolerance, convert to map units at current scale. x2 to turn radius into diameter
                const buffSize = 2 * tolerance * map.extent.getWidth() / map.width;

                // Build tolerance envelope of correct size
                const cBuff = new gapiService.gapi.Map.Extent(0, 0, buffSize, buffSize, point.spatialReference);

                // move the envelope so it is centered around the point
                return cBuff.centerAt(point);
            }

            /**
            * Run a query on a dynamic layer, return the result as a promise.
            * @function identifyEsriDynamicLayer
            * @param {Object} layerRecord esri layer object
            * @param {Object} opts additional argumets like map object, clickEvent, etc.
            * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
            */
            function identifyEsriDynamicLayer(layerRecord, opts) {
                const legendEntry = layerRecord.legendEntry;

                // ignore invisible layers by returning empty object
                if (!layerRecord.visibleAtMapScale || !layerRecord.visible || legendEntry.isLoading) {
                    return {};
                }

                const identifyResults = [];
                opts.layerIds = [];

                // every dynamic layer is a group in toc; walk its items to create an entry in details panel
                legendEntry.walkItems(legendEntry => {

                    // ignore invisible sublayers, offscale sublayers, and those where query option is false by returning empty object
                    if (!legendEntry.getVisibility() || !legendEntry.options.query.value ||
                        legendEntry.flags.scale.visible) {
                        return;
                    }

                    opts.layerIds.push(legendEntry.featureIdx); // tell server to query this layer
                    const identifyResult =
                        IDENTIFY_RESULT(legendEntry.name, legendEntry.symbology, 'EsriFeature', layerRecord,
                            legendEntry.featureIdx, legendEntry.master.name); // provide name of the master group as caption

                    identifyResults[legendEntry.featureIdx] = identifyResult;
                });

                // if all the dynamic layer children are unqueriable, do not run identify as with `opts.layerrIds` it will search through all of them and fail trying to access items in `identifyResults` which is also empty
                if (opts.layerIds.length === 0) {
                    return {};
                }

                opts.tolerance = layerRecord.clickTolerance;

                const identifyPromise = gapiService.gapi.layer.serverLayerIdentify(layerRecord._layer, opts)
                    .then(clickResults => {
                        RV.logger.log('identifyService', 'click result', clickResults);
                        const hitIndexes = []; // sublayers that we got results for

                        // transform attributes of click results into {name,data} objects
                        // one object per identified feature
                        //
                        // each feature will have its attributes converted into a table
                        // placeholder for now until we figure out how to signal the panel that
                        // we want to make a nice table
                        clickResults.forEach(ele => {
                            // NOTE: the identify service returns aliased field names, so no need to look them up here.
                            //       however, this means we need to un-alias the data when doing field lookups.
                            // NOTE: ele.layerId is what we would call featureIdx
                            hitIndexes.push(ele.layerId);

                            // get metadata about this sublayer
                            layerRecord.attributeBundle[ele.layerId].layerData.then(lData => {
                                const identifyResult = identifyResults[ele.layerId];

                                if (lData.supportsFeatures) {
                                    const unAliasAtt = unAliasAttribs(ele.feature.attributes, lData.fields);

                                    identifyResult.data.push({
                                        name: ele.value,
                                        data: attributesToDetails(ele.feature.attributes),
                                        oid: unAliasAtt[lData.oidField],
                                        symbology: [{
                                            svgcode: geoState.mapService.retrieveSymbol(unAliasAtt, lData.renderer)
                                        }]
                                    });
                                }
                                identifyResult.isLoading = false;
                            });
                        });

                        // set the rest of the entries to loading false
                        identifyResults.forEach(identifyResult => {
                            if (hitIndexes.indexOf(identifyResult.requester.featureIdx) === -1) {
                                identifyResult.isLoading = false;
                            }
                        });

                    });

                return {
                    identifyResults: identifyResults.filter(identifyResult => identifyResult), // collapse sparse array
                    identifyPromise
                };
            }

            /**
            * Run a getFeatureInfo on a WMS layer, return the result as a promise.  Fills the panelData array on resolution.
            * @function identifyOgcWmsLayer
            * @param {Object} layerRecord esri layer object
            * @param {Object} opts additional argumets like map object, clickEvent, etc.
            * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
            */
            function identifyOgcWmsLayer(layerRecord, opts) {
                const legendEntry = layerRecord.legendEntry;
                const infoMap = Geo.Layer.Ogc.INFO_FORMAT_MAP;

                // ignore layers with no mime type or invisible layers and those where query option is false by returning empty object
                if (!infoMap.hasOwnProperty(legendEntry.featureInfoMimeType) ||
                    !layerRecord.visible ||
                    !legendEntry.options.query.value ||
                    legendEntry.isLoading) {
                    return {};
                }

                const identifyResult =
                    IDENTIFY_RESULT(legendEntry.name, legendEntry.symbology, infoMap[legendEntry.featureInfoMimeType],
                        layerRecord);

                const identifyPromise = gapiService.gapi.layer.ogc
                    .getFeatureInfo(
                        layerRecord._layer,
                        opts.clickEvent,
                        legendEntry.layerEntries.map(le => le.id),
                        legendEntry.featureInfoMimeType)
                    .then(data => {
                        identifyResult.isLoading = false;

                        // TODO: check for French service
                        // check if a result is returned by the service. If not, do not add to the array of data
                        if (data.indexOf('Search returned no results') === -1 && data !== '') {
                            identifyResult.data.push(data);
                        }
                    });

                return { identifyResults: [identifyResult], identifyPromise };
            }

            /**
            * Run a query on a feature layer, return the result as a promise.  Fills the panelData array on resolution.
            * @function identifyEsriFeatureLayer
            * @param {Object} layerRecord esri layer object
            * @param {Object} opts additional argumets like map object, clickEvent, etc.
            * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
            */
            function identifyEsriFeatureLayer(layerRecord, opts) {
                const legendEntry = layerRecord.legendEntry;

                // ignore invisible layers and those where identify option is false by returning empty object
                if (!layerRecord.visibleAtMapScale || !layerRecord.visible ||
                    !legendEntry.options.query.value || legendEntry.isLoading) {
                    return {};
                }

                const identifyResult =
                    IDENTIFY_RESULT(legendEntry.name, legendEntry.symbology, 'EsriFeature',
                        layerRecord, legendEntry.featureIdx);

                // run a spatial query
                const qry = new gapiService.gapi.layer.Query();
                qry.outFields = ['*']; // this will result in just objectid fields, as that is all we have in feature layers

                // more accurate results without making the buffer if we're dealing with extents
                // polygons from added file need buffer
                if (layerRecord._layer.geometryType === 'esriGeometryPolygon' &&
                    legendEntry.id.search('esriFeature#') === -1) {
                    qry.geometry = opts.geometry;
                } else {
                    qry.geometry = makeClickBuffer(opts.clickEvent.mapPoint, opts.map, layerRecord.clickTolerance);
                }

                // no need to check if the layer is registered as this object comes from an array of registered layers
                const identifyPromise = $q.all([
                        layerRecord.getAttributes(legendEntry.featureIdx),
                        $q.resolve(layerRecord._layer.queryFeatures(qry)),
                        layerRecord.attributeBundle[legendEntry.featureIdx].layerData
                    ])
                    .then(([attributes, queryResult, layerData]) => {
                        // transform attributes of query results into {name,data} objects one object per queried feature
                        //
                        // each feature will have its attributes converted into a table
                        // placeholder for now until we figure out how to signal the panel that
                        // we want to make a nice table
                        identifyResult.isLoading = false;
                        identifyResult.data = queryResult.features.map(
                            feat => {
                                // grab the object id of the feature we clicked on.
                                const objId = feat.attributes[attributes.oidField];
                                const objIdStr = objId.toString();

                                // use object id find location of our feature in the feature array, and grab its attributes
                                const featAttribs = attributes.rows[attributes.oidIndex[objIdStr]];
                                return {
                                    name: getFeatureName(featAttribs, layerRecord, objIdStr),
                                    data: attributesToDetails(featAttribs, attributes.fields),
                                    oid: objId,
                                    symbology: [
                                        { svgcode: geoState.mapService.retrieveSymbol(featAttribs, layerData.renderer) }
                                    ]
                                };
                            });
                    });

                return { identifyResults: [identifyResult], identifyPromise };
            }

            /**
             * Modifies identify promises to always resolve, never reject.
             * Any errors caught will be added to the details data object.
             * Resolutions of these promises are for turning off loading indicator.
             *
             * @function makeInfalliblePromise
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
             * @function clickHandlerBuilder
             * @param {Object} clickEvent an ESRI event object for map click events
             */
            function clickHandlerBuilder(clickEvent) {
                geoState.mapService.clearHilight();

                if (getVisibleLayers() === 0) {
                    return;
                }

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
                    mapExtent: mapObject.extent
                };

                geoState.mapService.dropMapPin(clickEvent.mapPoint);

                layerRegistry
                    .getAllQueryableLayerRecords()
                    .forEach(layerRecord => {
                        const { identifyResults, identifyPromise } =
                            identifyHandlers[layerRecord.config.layerType](layerRecord, opts);

                        // identify function returns undefined is the layer is cannot be queries because it's not visible or for some other reason
                        if (typeof identifyResults === 'undefined') {
                            return;
                        }

                        // catch error on identify promises and store error messages to be shown in the details panel.
                        const loadingPromise = identifyPromise.catch(error => {
                            // add common error handling

                            RV.logger.warn('identifyService', `Identify query failed for
                                ${layerRecord.legendEntry.name} with error`, error);

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
                // show details panel only when there is data
                if (details.data.length) {
                    stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
                }
            }
        }
    }
})();
