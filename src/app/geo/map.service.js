/**
 * @module mapService
 * @memberof app.geo
 * @description
 *
 * The `mapService` factory holds references to the map dom node and the currently active map object.
 *
 */
angular
    .module('app.geo')
    .factory('mapService', mapServiceFactory);

function mapServiceFactory($timeout, referenceService, gapiService, configService, identifyService, events, $translate, errorService, layoutService) {
    const service = {
        destroyMap,
        makeMap,
        setAttribution,
        zoomToLatLong,

        getCenterPointInTargetBasemap,

        // TODO: should these functions be proxied through the geoService?
        addGraphicHighlight,
        addMarkerHighlight,
        clearHighlight,

        zoomToFeature,

        checkForBadZoom
    };

    return service;

    function setAttribution(config) {
        const cfgAtt = config.attribution;
        const mapInstance = configService.getSync.map.instance;
        const attNode = $(mapInstance.attribution.listNode.parentNode);
        const logoNode = attNode.parent().find('.logo-med');

        // esri default logo
        const esriLogo = 'url(data:image/png;base64,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)';

        // if config is undefined, show attribution text and use built in value
        // if it is !== then undefined take values from config file
        // for not esri basemap, logo should be disable if no custom logo are provided
        // because esri logo and liks are the default values
        if (typeof cfgAtt !== 'undefined') {
            if (cfgAtt.text.enabled && cfgAtt.text.value) {
                // loop through node keys to replace value with content from configuration file
                // TODO: test when will we have a base map with multiple layers
                for (let [key] of Object.entries(mapInstance.attribution.itemNodes)) {
                    mapInstance.attribution.itemNodes[key].innerText = cfgAtt.text.value;
                }
                attNode.show();
            } else if (!cfgAtt.text.enabled) {
                attNode.hide();
            }

            if (cfgAtt.logo.enabled) {
                // if values are supplied in the config file, use them
                // if not use the esri default value
                if (cfgAtt.logo.value && cfgAtt.logo.link) {
                    logoNode.css('background-image', `url(${cfgAtt.logo.value})`);
                    mapInstance.mapDefault('logoLink', cfgAtt.logo.link);
                } else {
                    logoNode.css('background-image', esriLogo);
                    mapInstance.mapDefault('logoLink', 'http://www.esri.com'); // TODO: create a function in geoapi to get default config value
                }
                logoNode.show();
                logoNode.css('visibility', 'visible');
            } else {
                logoNode.hide();
            }
        } else {
            logoNode.css('background-image', esriLogo);
            attNode.show();
            logoNode.show();
            logoNode.css('visibility', 'visible');
        }
    }

    /**
     * Destroys the current ESRI map objects and resets the typed map config object.
     *
     * @function destroyMap
     */
    function destroyMap() {
        const mapConfig = configService.getSync.map;

        mapConfig.instance._map.destroy();
        mapConfig.reset();

        referenceService.mapNode.empty();
        // FIXME: do we need to destroy scalebar and overview map even after we empty the node
    }

    /**
     * Creates an ESRI map object using map settings from the config file and map node from the storage service.
     * The map node never changes, so for any subsequent map making, the same node is used.
     *
     * @function makeMap
     */
    function makeMap() {
        const gapi = gapiService.gapi;
        const { map: mapConfig, services: servicesConfig } = configService.getSync;

        // dom node to build the map on; need to be specified only the first time the map is created and stored for reuse;
        const mapNode = referenceService.mapNode;

        const mapSettings = {
            basemaps: mapConfig.basemaps,
            scalebar: mapConfig.components.scaleBar,
            overviewMap: mapConfig.components.overviewMap,
            extent: _getStartExtent(mapConfig, mapNode),
            lods: mapConfig.selectedBasemap.lods,
            tileSchema: mapConfig.selectedBasemap.tileSchema
        };

        // TODO: convert service section of the config to typed objects
        if (servicesConfig.proxyUrl) {
            mapSettings.proxyUrl = servicesConfig.proxyUrl;
        }
        const mapInstance = new gapi.Map(mapNode[0], mapSettings);

        mapConfig.storeMapReference(mapInstance);
        mapConfig.instance.selectBasemap(mapConfig.selectedBasemap);
        setAttribution(mapConfig.selectedBasemap);

        _setMapListeners(mapConfig);
    }

    /**
     * Takes a location object in lat/long, converts to current map spatialReference using
     * reprojection method in geoApi, and zooms to the point.
     *
     * @function zoomToLatLong
     * @param {Object} location is a location object, containing geometries in the form of { longitude: <Number>, latitude: <Number> }
     */
    function zoomToLatLong(location) {
        configService.getSync.map.instance.zoomToPoint(location);
    }

    /**
     * Derives an initial extent using information from the bookmark
     * and the config file
     *
     * @function _getStartExtent
     * @private
     * @param {Map} mapConfig typed map config
     * @param {Object} mapNode dom node of the map
     * @returns {Object}            An extent where the map should initialize
     */
    function _getStartExtent(mapConfig, mapNode) {
        if (!mapConfig.startPoint) {
            return mapConfig.selectedBasemap.default;
        }

        // find the LOD set for the basemap in the config file,
        // then find the LOD closest to the scale provided by the bookmark.
        const zoomLod = gapiService.gapi.Map.findClosestLOD(
            mapConfig.selectedBasemap.lods, mapConfig.startPoint.scale)

        // using resolution of our target level of detail, and the size of the map in pixels,
        // calculate a rough extent of where our map should initialize.
        const xOffset = mapNode.outerHeight(true) * zoomLod.resolution / 2;
        const yOffset = mapNode.outerHeight(true) * zoomLod.resolution / 2;

        return {
            xmin: mapConfig.startPoint.x - xOffset,
            xmax: mapConfig.startPoint.x + xOffset,
            ymin: mapConfig.startPoint.y - yOffset,
            ymax: mapConfig.startPoint.y + yOffset,
            spatialReference: mapConfig.selectedBasemap.default.spatialReference
        };
    }

    /**
     * A helper function for reprojecting a center point of the source basemap to the target basemap.
     * Used for bookmarking.
     *
     * @function getCenterPointInTargetBasemap
     * @param {ESRIMapWrapper} mapInstance a geoapi map wrapper
     * @param {Basemap} sourceBasemap currently selected basemap
     * @param {Basemap} targetBasemap a target basemap to projection the center point to
     * @return {Object} in the form of { x: Number, y: Number, scale: Number }
     */
    function getCenterPointInTargetBasemap(mapInstance, sourceBasemap, targetBasemap) {
        const extentCenter = mapInstance.extent.getCenter();
        const scale = mapInstance._map.getScale();

        // find the LOD set for the basemap in the config file,
        // then find the LOD closest to the scale provided by the bookmark.
        const targetZoomLod = gapiService.gapi.Map.findClosestLOD(
            targetBasemap.lods, scale);

        // project bookmark point to the map's spatial reference
        const coords = gapiService.gapi.proj.localProjectPoint(
            sourceBasemap.default.spatialReference,
            targetBasemap.default.spatialReference,
            { x: extentCenter.x, y: extentCenter.y });

        return {
            x: coords.x,
            y: coords.y,
            scale: targetZoomLod.scale
        };
    }

    /**
     * Ready a trigger on the map load event.
     * Also initialize map full extent.
     *
     * @function _setMapListeners
     * @param {Map} mapConfig typed map config object
     * @private
     */
    function _setMapListeners(mapConfig) {
        // we are returning a promise that resolves when the map load happens.
        const gapi = gapiService.gapi;
        let mapLoadingTimeout;

        _setLoadingFlag(true);

        gapi.events.wrapEvents(mapConfig.instance, {
            load: () => {
                events.$broadcast(events.rvMapLoaded, mapConfig.instance);
                // setup hilight layer
                mapConfig.highlightLayer = gapi.hilight.makeHilightLayer({});
                mapConfig.instance.addLayer(mapConfig.highlightLayer);

                // mark the map as loaded so data layers can be added
                mapConfig.isLoaded = true;

                // TODO: maybe it makes sense to fire `mapReady` event here instead of in geo service
                _setLoadingFlag(false);
            },
            'update-start': () => {
                _setLoadingFlag(true, 300);
            },
            'extent-change': data => {
                // remove highlighted features and the haze when the map is panned, zoomed, etc.
                if (angular.isObject(data.delta) &&
                    (data.delta.x !== 0 || data.delta.y !== 0 || data.levelChange)) {
                    clearHighlight(false);
                }

                events.$broadcast(events.rvExtentChange, data);
            },
            'mouse-move': data =>
                events.$broadcast(events.rvMouseMove, data.mapPoint),
            'update-end': () => {
                _setLoadingFlag(false, 100);
            },
            click: clickEvent => {
                clearHighlight();
                addMarkerHighlight(clickEvent.mapPoint);
                identifyService.identify(clickEvent);
            }
        });

        /**
         * Sets `isMapLoading` flag indicating map layers are updating.
         *
         * @function _setLoadingFlag
         * @param {Boolean} isLoading defaults to true; flag indicating if one or more layers begins updating their content
         * @param {Number}  delay     defaults to 0; delay before setting `isMapLoading` state; useful to avoid setting indicator for a small amounts of time
         * @private
         */
        function _setLoadingFlag(isLoading = true, delay = 0) {
            $timeout.cancel(mapLoadingTimeout);
            mapLoadingTimeout = $timeout(() =>
                (mapConfig.isMapLoading = isLoading), delay);
        }
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
            const ubGraphics = gapi.hilight.getUnboundGraphics(
                [graphicBundle], mapConfig.instance.spatialReference);

            ubGraphics[0].then(unboundG => {
                console.log('unbound graphic for hilighting ', unboundG);
                mapConfig.highlightLayer.addHilight(unboundG);
            });
        });

        _toggleHighlightHaze(showHaze);
    }

    /**
     * Adds a marker to the highlight layer to accentuate the click point. Also can turn the "haze" on or off.
     *
     * @param {Object} mapPoint click point from the ESRI click event
     * @param {Boolean | null} showHaze [optional = null] `true` turns on the "haze"; `false`, turns it off; `null` keeps it's current state
     */
    function addMarkerHighlight(mapPoint, showHaze = null) {
        const mapConfig = configService.getSync.map;
        mapConfig.highlightLayer.addMarker(mapPoint);

        _toggleHighlightHaze(showHaze);
    }

    /**
     * Removes the highlighted features and markers.
     *
     * @function clearHighlight
     * @param {Boolean | null} showHaze [optional = null] `true` turns on the "haze"; `false`, turns it off; `null` keeps it's current state
     */
    function clearHighlight(showHaze = null) {
        const mapConfig = configService.getSync.map;
        mapConfig.highlightLayer.clearHilight();

        _toggleHighlightHaze(showHaze);
    }

    /**
     * Toggles the "haze" obscuring all other features and layers except the highlight layer.
     *
     * @function _toggleHighlightHaze
     * @private
     * @param {Boolean | null} value [optional = null] `true` turns on the "haze"; `false`, turns it off; `null` keeps it's current state
     */
    function _toggleHighlightHaze(value = null) {
        if (value !== null) {
            angular.element(referenceService.mapNode).toggleClass('rv-map-highlight', value);
        }
    }

    /**
     * Zoom to a single feature given its proxy layer object and oid.
     * Takes into account main panel offset and trigger `peekAtMap` if offsets are too great.
     *
     * @param {LayerProxy} proxy proxy layer object containing the feature
     * @param {Number} oid feature object id
     * @return {Promise} a promise resolving after map completes extent change
     */
    function zoomToFeature(proxy, oid) {
        const offset = referenceService.mainPanelsOffset
        const peekFactor = 0.4;
        // if either of the offsets is greater than 80%, peek at the map instead of offsetting the map extent
        if (offset.x > peekFactor || offset.y > peekFactor) {
            offset.x = offset.y = 0;
            referenceService.peekAtMap();
        }

        const zoomPromise = proxy.zoomToGraphic(
            oid, configService.getSync.map.instance, offset)
            .then(() => {
                const graphiBundlePromise = proxy.fetchGraphic(oid);
                service.addGraphicHighlight(graphiBundlePromise, true);
            });

        return zoomPromise;
    }

    /**
     * Checks if the recent extent change moves the extent center outside of the current basemap's full extent and
     * displays a toast notification asking the user if they want to move to the adjusted extent.
     *
     * @function checkForBadZoom
     */
    function checkForBadZoom() {
        const mapConfig = configService.getSync.map;
        const map = mapConfig.instance;
        const fullExtent = map.enhanceConfigExtent(mapConfig.selectedBasemap.full);
        const checkResult = gapiService.gapi.Map.enforceBoundary(map.extent, fullExtent);

        if (checkResult.adjusted) {
            // create notification toast
            const toast = {
                textContent: $translate.instant('toc.boundaryZoom.badzoom'),
                action: $translate.instant('toc.boundaryZoom.undo'),
                parent: layoutService.panels.shell
            };

            // promise resolves with 'ok' when user clicks 'undo'
            errorService.display(toast)
                .then(response =>
                    response === 'ok' ? map.setExtent(checkResult.newExtent, true) : () => {});
        }
    }
}
