import { MouseEvent, MapClickEvent } from 'api/events';
import { IdentifyMode } from 'api/layers';

/**
 * @module identifyService
 * @memberof app.geo
 *
 * @description
 * Generates handlers for feature identification on all layer types.
 */
angular.module('app.geo').factory('identifyService', identifyService);

function identifyService($q, configService, gapiService, referenceService, stateManager, events) {
    const service = {
        identify,
        addGraphicHighlight,
        clearHighlight,
        toggleHighlightHaze
    };

    let mApi = null;
    events.$on(events.rvApiMapAdded, (_, api) => (mApi = api));

    let sessionId = 0;

    return service;

    /**
     * Convert an API XY object to a fake click event
     *
     * @param {XY} xy an API XY object
     * @param {Object} mapInstance a reference to the map (caller has it, saves us looking it up again)
     * @returns {Object} a fake click event containing mapPoint and screenPoint
     */
    function XYtoFakeEvent(xy, mapInstance) {
        // shift from latlong (XY is native to that) to map projection
        const mapPoint = xy.projectToPoint(mapInstance.spatialReference.wkid);

        // generate screen co-ords if possible. needed for WMS identifies.
        const screenPoint = mapInstance.toScreen(mapPoint);

        // make a fake click-event-like object
        return {
            mapPoint,
            screenPoint
        };
    }

    /**
     * Handles global map identifies.  Currently configured to walk through all layer records
     * and trigger service side identify queries.
     * GeoApi is responsible for performing client side spatial queries on registered
     * feature layers or server side queries for everything else.
     *
     * @function identify
     * @param {Event} clickOrXY an ESRI map click event or an XY object from the API
     * @returns {Object} { details?: { data: Promise<any>[], isLoaded: Promise<boolean> }, requester?: { mapPoint: any } }
     */
    function identify(clickOrXY) {
        const mapInstance = configService.getSync.map.instance;
        const isClick = !clickOrXY.projectToPoint;
        let clickEvent;

        if (isClick) {
            // raw input user, the param is a click. donethanks
            clickEvent = clickOrXY;
        } else {
            // our input is an XY api object
            // make a fake click-event-like object
            clickEvent = XYtoFakeEvent(clickOrXY, mapInstance);
        }

        sessionId++;

        const opts = {
            clickEvent,
            map: mapInstance,
            geometry: clickEvent.mapPoint,
            width: mapInstance.width,
            height: mapInstance.height,
            mapExtent: mapInstance.extent
        };

        // TODO: the order of layerRecords might not match the order of the legend block; best to use the order of the layers from the config file
        // see `synchronizeLayerOrder` function in the `layer-registry` for more details on sorting
        const identifyInstances = configService.getSync.map.layerRecords
            // TODO: can we expose identify on all layer record types and vet in geoapi for consistency
            .filter(layerRecord => typeof layerRecord.identify !== 'undefined')
            .map(layerRecord => {
                const apiLayer = mApi.layers.getLayersById(layerRecord.layerId)[0];
                const layerTolerance = apiLayer ? apiLayer.identifyBuffer : undefined;
                opts.tolerance = layerTolerance;
                return layerRecord.identify(opts);
            })
            // identify function returns undefined is the layer is cannot be queries because it's not visible or for some other reason
            .filter(identifyInstance => typeof identifyInstance.identifyResults !== 'undefined');

        const allIdentifyResults = [].concat(...identifyInstances.map(({ identifyResults }) => identifyResults));
        const mapClickEvent = new MapClickEvent(clickEvent, mApi);

        mapClickEvent.apiInitiated = !isClick;
        mApi._clickSubject.next(mapClickEvent);

        const allLoadingPromises = identifyInstances.map(({ identifyPromise, identifyResults }) => {
            // catch error on identify promises and store error messages to be shown in the details panel.
            const loadingPromise = identifyPromise.catch(error => {
                // add common error handling

                console.warn('identifyService', `Identify query failed with error`, error);

                identifyResults.forEach(identifyResult => {
                    // TODO: this outputs raw error message from the service
                    // we might want to replace it with more user-understandable messages
                    identifyResult.error = error.message;
                    identifyResult.isLoading = false;
                });
            });

            const infallibleLoadingPromise = makeInfalliblePromise(loadingPromise);

            infallibleLoadingPromise.then(() => {
                identifyResults.forEach(idResult => {
                    const featureList = idResult.data || [];
                    featureList.forEach(feat => {
                        mapClickEvent._featureSubject.next(feat);
                    });
                });
            });

            return infallibleLoadingPromise;
        });

        if (allIdentifyResults.length === 0) {
            return {};
        }

        // convert esri click event into the API mouse event and add to the identify session and all identify requests
        const identifyMouseEvent = new MouseEvent(clickEvent, mApi);

        // map identify instances to identify requests
        const identifyRequests = identifyInstances.reduce((map, { identifyPromise, identifyResults }) => {
            const requests = identifyResults.map(r => ({
                // TODO: include the actual referenced layer
                layer: "I' layer",
                event: identifyMouseEvent,
                sessionId,
                features: identifyPromise.then(() => r.data)
            }));

            return map.concat(requests);
        }, []);

        // push identify requests into the API stream
        // the subscribers can modify/add/remove the items returned by the results
        // if the items are removed from the `identifyResults[].data` array,
        // they will not be highlighted or shown in the details panel
        if (mApi.layers.identifyMode.includes(IdentifyMode.Query)) {
            mApi.layers._identify.next({
                event: identifyMouseEvent,
                sessionId,
                requests: identifyRequests
            });
        }

        const details = {
            data: allIdentifyResults,
            isLoaded: $q.all(allLoadingPromises).then(() => true)
        };

        // store the mappoint in the requester so it's possible to show a marker if there is no feature to highlight
        const requester = {
            mapPoint: clickEvent.mapPoint
        };

        // show details panel only when there is data and the identifyMode is set to `Details`
        if (mApi.layers.identifyMode.includes(IdentifyMode.Details)) {
            stateManager.toggleDisplayPanel('mainDetails', details, requester, 0);
        }

        if (mApi.layers.identifyMode.includes(IdentifyMode.Highlight)) {
            // highlight if the identifyMode is set fo 'Highlight'
            highlightIdentifyResults({ details, requester });
        }

        return { details, requester };

        /**
         * Modifies identify promises to always resolve, never reject.
         * Any errors caught will be added to the details data object.
         * Resolutions of these promises are for turning off loading indicator.
         *
         * @function makeInfalliblePromise
         * @private
         * @param  {Promise} promise [description]
         * @return {Promise} promise that doesn't reject
         */
        function makeInfalliblePromise(promise) {
            const modifiedPromise = $q(resolve => promise.then(() => resolve(true)).catch(() => resolve(true)));

            return modifiedPromise;
        }
    }

    /**
     * Highlights all resolved identify results. Accepts the identify response returned by the identify service call.
     *
     * @param {Object} { details, requester }: { details: { isLoaded: Promise<boolean>, data: IdentifyResult[] }, requester: { mapPoint: MapPoint }}
     */
    function highlightIdentifyResults({ details, requester }) {
        // if `details` is not set, the identify call hasn't been complete (no layers added to the map, for example)
        if (!details) {
            return;
        }

        const mapConfig = configService.getSync.map;
        let isCleared = false;

        details.isLoaded.then(() => {
            // details.data contains a list of identify results; one result per feature layer or dynamic sublayer or wms layer
            details.data.forEach(identifyResult =>
                identifyResult.data.forEach(dataItem => {
                    // clear everything before adding more highlights, but only once after it's clear there is at least one result
                    if (!isCleared) {
                        isCleared = true;
                        clearHighlight();
                    }

                    // only actual features can be highlighted; identify results from WMS and other raster layers cannot
                    if (!dataItem.oid) {
                        return;
                    }

                    const graphiBundlePromise = identifyResult.requester.proxy.fetchGraphic(dataItem.oid, {
                        map: mapConfig.instance,
                        geom: true,
                        attribs: true
                    });

                    addGraphicHighlight(graphiBundlePromise, mApi.layers.identifyMode.includes(IdentifyMode.Haze));
                })
            );
        });
    }

    /**
     * Adds the provided graphic to the highlight layer. Also can turn the "haze" on or off.
     *
     * @function addGraphicHighlight
     * @param {Object} graphicBundlePromise the promise resolving with the graphic bundle; these bundles are returned by `fetchGraphic` when called on a proxy layer object
     * @param {Boolean | null} showHaze [optional = null] `true` turns on the "haze"; `false`, turns it off; `null` keeps it's current state
     */
    function addGraphicHighlight(graphicBundlePromise, showHaze = false) {
        const gapi = gapiService.gapi;
        const mapConfig = configService.getSync.map;

        graphicBundlePromise.then(graphicBundle => {
            const ubGraphics = gapi.hilight.getUnboundGraphics([graphicBundle], mapConfig.instance.spatialReference);

            ubGraphics[0].then(unboundG => {
                console.log('unbound graphic for highlighting ', unboundG);
                mapConfig.highlightLayer.addHilight(unboundG);
            });
        });

        toggleHighlightHaze(showHaze);
    }

    /**
     * Removes the highlighted features and markers.
     *
     * @function clearHighlight
     * @param {Boolean | null} [showHaze = null] `true` turns on the "haze"; `false`, turns it off; `null` keeps it's current state
     */
    function clearHighlight(showHaze = null) {
        const mapConfig = configService.getSync.map;
        mapConfig.highlightLayer.clearHilight();

        toggleHighlightHaze(showHaze);
    }

    /**
     * Toggles the "haze" obscuring all other features and layers except the highlight layer.
     *
     * @function toggleHighlightHaze
     * @param {Boolean | null} value [optional = null] `true` turns on the "haze"; `false`, turns it off; `null` keeps it's current state
     */
    function toggleHighlightHaze(value = null) {
        if (value !== null) {
            angular.element(referenceService.mapNode).toggleClass('rv-map-highlight', value);
        }
    }
}
