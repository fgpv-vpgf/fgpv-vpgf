/*global geolocator*/
(() => {
    'use strict';

    /**
     * @module mapService
     * @memberof app.geo
     * @requires $q
     * @description
     *
     * The `mapService` factory holds references to the map dom node and the currently active map object.
     *
     */
    angular
        .module('app.geo')
        .factory('mapService', mapServiceFactory);

    function mapServiceFactory($q, $timeout, gapiService, storageService) {
        const settings = { zoomPromise: $q.resolve(), zoomCounter: 0 };
        return mapService;

        function mapService(geoState, config) {

            const initProps = ['fullExtent', 'mapExtent', 'lods', 'selectedBaseMapId',
                'selectedBaseMapExtentSetId', 'selectedBaseMapLodId', 'blankBaseMapId', 'hilight'];

            initProps.forEach(prop => {
                if (angular.isUndefined(geoState[prop])) {
                    geoState[prop] = null;
                }
            });

            // this `service` object will be exposed through `geoService`
            const service = {
                /**
                 * A reference to the main map object.  FIXME possible refactor
                 * @member mapObject
                 */
                mapObject: null,
                /**
                 * A reference to the geoApi mapManager instance.  FIXME possible refactor
                 * @member mapObject
                 */
                mapManager: null, // Object

                baseMapHasSameSP,
                setZoom,
                shiftZoom,
                selectBasemap,
                setFullExtent,
                setSelectedBaseMap,
                zoomToGraphic,
                validateProj,
                retrieveSymbol,
                hilightGraphic,
                clearHilight,
                dropMapPin,
                fetchLocation
            };

            return buildMapObject();

            /***/

            /**
             * Builds an actual esri map object.
             * @function buildMapObject
             * @private
             * @return {Object} returns `service` object
             */
            function buildMapObject() {

                let mapObject;

                // reset before rebuilding the map if `geoState` already has an instance of mapService
                if (typeof geoState.mapService !== 'undefined') {
                    // NOTE: Possible to have dom listeners stick around after the node is destroyed
                    const mapService = geoState.mapService;
                    mapService.mapObject.destroy();
                    mapService.mapManager.ScalebarControl.destroy();
                    mapService.mapManager.OverviewMapControl.destroy();
                    mapService.mapObject = null;
                }

                // set selected base map id
                if (!geoState.selectedBaseMapId) {
                    setSelectedBaseMap(config.map.initialBasemapId || config.baseMaps[0].id, config);
                }

                // FIXME remove the hardcoded settings when we have code which does this properly
                mapObject = gapiService.gapi.mapManager.Map(geoState.mapNode, {

                    // basemap: 'gray',
                    extent: geoState.mapExtent,
                    lods: geoState.lods
                });

                // store map object in service
                service.mapObject = mapObject;

                if (config.services && config.services.proxyUrl) {
                    gapiService.gapi.mapManager.setProxy(config.services.proxyUrl);
                }

                // setup map using configs
                // FIXME: I should be migrated to the new config schema when geoApi is updated
                const mapSettings = {
                    basemaps: [],
                    scalebar: {},
                    overviewMap: {}
                };

                if (config.baseMaps) {
                    mapSettings.basemaps = config.baseMaps;
                }

                if (config.map.components.scaleBar) {
                    mapSettings.scalebar = {
                        attachTo: 'bottom-left',
                        scalebarUnit: 'dual'
                    };
                }

                if (config.map.components.overviewMap && config.map.components.overviewMap.enabled) {

                    // FIXME: overviewMap has more settings
                    mapSettings.overviewMap = config.map.components.overviewMap;
                }

                const onMapLoad = prepMapLoad();

                service.mapManager = gapiService.gapi.mapManager.setupMap(mapObject, mapSettings);
                service.mapManager.BasemapControl.setBasemap(geoState.selectedBaseMapId);

                // FIXME temp link for debugging
                window.FGPV = {
                    layers: service.layers
                };

                // store service in geoState
                geoState.mapService = service;

                // return a promise that resolves in the service once the map has loaded
                return onMapLoad.then(() => service);
            }

            /**
             * Retrieve full extent from extentSets.
             * @function getFullExtFromExtentSets
             * @private
             */
            function getFullExtFromExtentSets(extentSets) {

                // FIXME: default basemap should be indicated in the config as well
                // const currentBasemapExtentSetId = '123456789';

                if (extentSets) {
                    // In configSchema, at least one extent for a basemap
                    const extentSetForId = extentSets.find(extentSet => {
                        if (extentSet.id === geoState.selectedBaseMapExtentSetId) {
                            return true;
                        }
                    });

                    // no matching id in the extentset
                    if (angular.isUndefined(extentSetForId)) {
                        throw new Error('could not find an extent set with matching id.');
                    }

                    // find the full extent type from extentSetForId
                    const lFullExtent = (extentSetForId.full) ? extentSetForId.full :
                        (extentSetForId.default) ? extentSetForId.default :
                        (extentSetForId.maximum) ? extentSetForId.maximum : null;

                    return lFullExtent;
                } else {
                    return null;
                }
            }

            /**
             * Retrieve level of details array from config for current basemap.
             * @function getLod
             * @private
             */
            function getLod(lodSets) {

                // In configSchema, at least one extent for a basemap
                const lodForId = lodSets.find(lodSet => {
                    if (lodSet.id === geoState.selectedBaseMapLodId) {
                        return true;
                    }
                });

                // no matching id in the extentset
                if (angular.isUndefined(lodForId)) {
                    throw new Error('could not find an LOD set with matching id.');
                }

                return lodForId.lods;
            }

            /**
             * Switch basemap based on the uid provided.
             * @function selectBasemap
             * @param {string} id identifier for a specific basemap layerbower
             */
            function selectBasemap(id) {
                const mapManager = service.mapManager;

                // const map = service.mapObject;

                if (typeof mapManager === 'undefined' || !mapManager.BasemapControl) {
                    console.error('Error: Map manager or basemap control is not setup,' +
                        ' please setup map manager by calling setupMap().');
                } else {

                    if (id.startsWith('blank_basemap_')) {

                        // get the current selected basemap id
                        const oldBaseMap = mapManager.BasemapControl.basemapGallery.getSelected();
                        geoState.blankBaseMapId = oldBaseMap.id;
                        hideBaseMap(true);

                        // update id
                        id = oldBaseMap.id;
                    } else {

                        // restore opacity from previous hidden base map hide if needed
                        if (geoState.blankBaseMapId !== null) {
                            hideBaseMap(false);
                        }
                    }

                    // call this to set the base map, need to call this for all, this will force
                    // update for the blank base map.
                    mapManager.BasemapControl.setBasemap(id);

                }
            }

            /**
             * Check to see if given base map id has same wkid value as previously selected base map.
             * @function baseMapHasSameSP
             * @param {String} id base map id
             * @return {bool} true if current base map has the same wkid as the previous one
             */
            function baseMapHasSameSP(id) {

                const blankBaseMapIdPattern = 'blank_basemap_';
                let newWkid;

                // check to see if current base map is blank base map, get wkid accordingly
                if (id.startsWith(blankBaseMapIdPattern)) {
                    newWkid = parseInt(id.slice(blankBaseMapIdPattern.length, id.length));
                } else {
                    const newBaseMap = getBaseMapConfig(id, config);
                    newWkid = newBaseMap.wkid;
                }

                let oldWkid;

                // check to see if previous selected base map is blank or not, get wkid accordingly
                if (geoState.selectedBaseMapId.startsWith(blankBaseMapIdPattern)) {
                    oldWkid = parseInt(geoState.selectedBaseMapId.slice(blankBaseMapIdPattern.length,
                        geoState.selectedBaseMapId.length));
                } else {
                    const oldBaseMap = getBaseMapConfig(geoState.selectedBaseMapId, config);
                    oldWkid = oldBaseMap.wkid;
                }

                return (oldWkid === newWkid);

            }

            /**
             * Sets zoom level of the map to the specified level.
             * @function setZoom
             * @param {number} value a zoom level number
             */
            function setZoom(value) {
                service.mapObject.setZoom(value);
            }

            /**
             * Changes the zoom level by the specified value relative to the current level; can be negative.
             * To avoid multiple chained zoom animations when rapidly pressing the zoom in/out icons, we
             * update the zoom level only when the one before it resolves with the net zoom change.
             *
             * @function shiftZoom
             * @param  {number} byValue a number of zoom levels to shift by
             */
            function shiftZoom(byValue) {
                settings.zoomCounter += byValue;
                settings.zoomPromise.then(() => {
                    if (settings.zoomCounter !== 0) {
                        let zoomValue = service.mapObject.getZoom() + settings.zoomCounter;
                        settings.zoomCounter = 0;
                        settings.zoomPromise = service.mapObject.setZoom(zoomValue);
                    }
                });
            }

            /**
             * Set the map to full extent.
             * @function setFullExtent
             */
            function setFullExtent() {
                const map = service.mapObject;
                if (geoState.fullExtent) {
                    map.setExtent(geoState.fullExtent);
                } else {
                    console.warn('GeoService: fullExtent value is not set.');
                }
            }

            /**
             * Fetches a graphic from the given layer.
             * Will attempt local copy, will hit the server if not available.
             *
             * @function fetchGraphic
             * @param  {Object} layer the layer record object to search
             * @param  {Integer} featureIdx the index of the layer (relevant for dynamic sub-layers)
             * @param  {Integer} objId ID of object being searched for
             * @returns {Promise} resolves with a bundle of information. .graphic is the graphic; .source is where it came from - 'layer' or 'server'; also .layer and .featureIdx for convenience
             */
            function fetchGraphic(layer, featureIdx, objId) {

                // FIXME _layer reference
                // TODO make result object structure an ES6 class
                const layerObj = layer._layer;
                const result = {
                    graphic: null,
                    source: null,
                    layer,
                    featureIdx
                };

                // if triggers when layer has no service, or all geometry is on client, in which case we use local geometry instead of pulling from server
                // snapshot mode is set by the constant MODE_SNAPSHOT that maps to 0 in esri's api for FeatureLayer
                if (layerObj.graphics) {
                    const myG = layerObj.graphics.find(g => {
                        return g.attributes[layerObj.objectIdField] === objId;
                    });
                    if (myG) {
                        result.graphic = myG;
                        result.source = 'layer';
                        return $q.resolve(result);
                    }
                }

                // were not able to get a local copy of the graphic. to the server
                // TODO add some error handling. Cases: failed server call. server call is not a feature
                // TODO add some caching to this. if we get a result, save it somewhere. grab that if requested a 2nd time

                // layerUrl is the URL that the point to be zoomed to belongs to
                // TODO if we ever add an "index-free url" property, use that instead and avoid the if
                let layerUrl = layerObj.url + '/';
                if (!layerObj.graphics) {
                    // it is a dynamic layer, so we need to append the feature index to the URL.
                    layerUrl = layerUrl + featureIdx + '/';
                }

                return gapiService.gapi.layer.getFeatureInfo(layerUrl, objId)
                    .then(geoInfo => {
                        // server result omits spatial reference
                        geoInfo.feature.geometry.spatialReference = layerObj.spatialReference;
                        result.graphic = geoInfo.feature;
                        result.source = 'server';
                        return result;
                    });
            }

            /**
             * Fetches a feature in a layer given the layerUrl and objId of the object and then zooms to it.
             * Only handles feature related layers (feature, dynamic). Will also apply a hilight to the feature.
             *
             * @function zoomToGraphic
             * @param  {Object} layer is the layer record of graphic to zoom
             * @param  {Integer} featureIdx the index of the layer (relevant for dynamic sub-layers)
             * @param  {Integer} objId is ID of object to be zoomed to
             */
            function zoomToGraphic(layer, featureIdx, objId) {
                const map = service.mapObject;

                // FIXME _layer reference
                const zoomLevel = gapiService.gapi.symbology.getZoomLevel(map.__tileInfo.lods, layer._layer.maxScale);

                fetchGraphic(layer, featureIdx, objId).then(gBundle => {
                    zoomWithOffset(gBundle.graphic.geometry, zoomLevel).then(() => {
                        applyHilight(gBundle);
                    });
                });
            }

            /**
             * Fetches a point in a layer given the layerUrl and objId of the object and then hilights to it.
             * Only handles feature related layers (feature, dynamic).
             *
             * @function hilightGraphic
             * @param  {Object} layer is the layer record of graphic to zoom
             * @param  {Integer} featureIdx the index of the layer (relevant for dynamic sub-layers)
             * @param  {Integer|Array} objId is ID or array of IDs of object(s) to hilight
             */
            function hilightGraphic(layer, featureIdx, objId) {
                const objIds = Array.isArray(objId) ? objId : [objId];
                const fetchPromises = objIds.map(oid => fetchGraphic(layer, featureIdx, oid));

                $q.all(fetchPromises).then(graphicBundles => {
                    applyHilight(graphicBundles);
                });
            }

            /**
             * Clears any hilights, pins, and hazes from the hilight layer.
             * @function clearHilight
             */
            function clearHilight() {
                geoState.hilight.clearHilight();
            }

            /**
             * Adds a location pin to the hilight layer.
             *
             * @function dropMapPin
             * @param  {Object} mapPoint ESRI point defining where to put the pin
             */
            function dropMapPin(mapPoint) {
                geoState.hilight.addPin(mapPoint);
            }

            /**
             * Performs the application of a hilight for a graphic.
             *
             * @function applyHilight
             * @private
             * @param  {Object|Array} graphicBundle a graphic bundle or array of graphic bundles for the item(s) to hilight
             * @see fetchGraphic
             */
            function applyHilight(graphicBundle) {

                const bundles = Array.isArray(graphicBundle) ? graphicBundle : [graphicBundle];

                // generate detached graphics to give to the hilight layer.
                const hilitePromises = gapiService.gapi.hilight.getUnboundGraphics(bundles,
                    service.mapObject.spatialReference);

                $q.all(hilitePromises).then(hilightGraphics => {
                    geoState.hilight.addHilight(hilightGraphics);
                });
            }

            /**
             * Given a geometry, attributes, spatialReference and zoomlevel, reprojects geometry from its spatialReference
             * to the map's spatialReference, then zooms to the maximum level such that the geometry is still visible.
             *
             * @function zoomWithOffset
             * @param  {Object} geo is the geometry to be zoomed to
             * @param  {Integer} zoomLevel is the max level of zoom such that the layer is still visible on the map and not out of scale
             * @returns {Promise} resolves when zoom finishes
             */
            function zoomWithOffset(geo, zoomLevel) {
                const map = service.mapObject;

                const barWidth = storageService.panels.sidePanel.outerWidth();
                const mapWidth = storageService.panels.map.outerWidth();

                // barWidth/mapWidth is the % of map blocked by side panel
                // shifting by 1/2 % of blocked map offsets point to center of visible map
                // this ratio always changes based on window resizing/map resizing
                // since the side panel is always 400px; need ratio every time zoom happens
                const ratio = (barWidth / mapWidth) / 2;

                // make new graphic (on the chance it came from server and is just raw geometry)
                const newg = gapiService.gapi.proj.Graphic({
                    geometry: geo
                });

                // TODO only do this if projections are actually different.
                // reproject graphic to spatialReference of the map
                const gextent = gapiService.gapi.proj.localProjectExtent(
                    gapiService.gapi.proj.graphicsUtils.graphicsExtent([newg]),
                    map.spatialReference);

                // need to make new esri extent to use getCenter function
                const newExt = gapiService.gapi.mapManager.Extent(gextent.x1, gextent.y1,
                    gextent.x0, gextent.y0, gextent.sr);

                // handles extent
                if ((newExt.xmin !== newExt.xmax) && (newExt.ymin !== newExt.ymax)) {
                    const eExt = newExt.expand(4);
                    const xOffset = (eExt.xmax - eExt.xmin) * ratio * (-1);
                    const gExt = eExt.offset(xOffset, (eExt.ymax - eExt.ymin) / 4);
                    return map.setExtent(gExt);
                } else {
                    // handles points
                    const pt = newExt.getCenter();
                    const zoomed = map.setZoom(zoomLevel);
                    return zoomed.then(() => {
                        const xOffset = (map.extent.xmax - map.extent.xmin) * ratio * (-1);
                        const newPt = pt.offset(xOffset, (map.extent.ymax - map.extent.ymin) / 4);
                        return map.centerAt(newPt, zoomLevel);
                    });
                }
            }

            /**
            * Takes a location object in lat/long, converts to current map spatialReference using
            * reprojection method in geoApi, and zooms to the point.
            *
            * @function geolocate
            * @param {Object} location is a location object, containing geometries in lat/long
            */
            function geolocate(location) {
                const map = service.mapObject;

                // get reprojected point and zoom to it
                const geoPt = gapiService.gapi.proj.localProjectPoint(4326, map.spatialReference.wkid,
                    [parseFloat(location.coords.longitude), parseFloat(location.coords.latitude)]);
                const zoomPt = gapiService.gapi.proj.Point(geoPt[0], geoPt[1], map.spatialReference);
                map.centerAndZoom(zoomPt, map.__tileInfo.lods[map.__tileInfo.lods.length - 3].level);
            }

            /**
            * Fetches current location using browser HTML5 location. If refused,
            * falls back to fetch location by IP address then zooms to the location.
            * @private
            * @function fetchLocation
            */
            function fetchLocation() {
                geolocator.locate(geolocate, err => {
                    console.warn('Geolocation error: ', err);
                }, 0, { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
            }

            /**
             * Retrieves symbology icon for a feature.
             *
             * @function retrieveSymbol
             * @param  {Object} attribs    attributes of the feature we want a symbol for
             * @param  {Object} renderer   enhanced renderer object for the layer in server format
             * @return {String} data-url that will render the symbology
             */
            function retrieveSymbol(attribs, renderer) {
                return gapiService.gapi.symbology.getGraphicIcon(attribs, renderer);
            }

            /**
            * Sets the current selected map id and extent set id, creates the fullExtent.
            * @function setSelectedBaseMap
            * @param {String} id of base map
            */
            function setSelectedBaseMap(id) {
                const blankBaseMapIdPattern = 'blank_basemap_';

                geoState.selectedBaseMapId = id;

                let selectedBaseMap;

                // search base map config based on  'blank_basemap_' condition
                if (!id.startsWith(blankBaseMapIdPattern)) {

                    selectedBaseMap = config.baseMaps.find(baseMap => {
                        return (baseMap.id === geoState.selectedBaseMapId);
                    });

                } else {
                    const wkid = parseInt(id.slice(blankBaseMapIdPattern.length, id.length));

                    // find the first base map that has the matching wkid
                    selectedBaseMap = config.baseMaps.find(baseMap => {
                        return (baseMap.wkid === wkid);
                    });

                    geoState.blankBaseMapId = selectedBaseMap.id;
                    hideBaseMap(true);
                }

                // get selected base map extent set id, so we can store teh map extent
                geoState.selectedBaseMapExtentSetId = selectedBaseMap.extentId;
                geoState.selectedBaseMapLodId = selectedBaseMap.lodId;

                const fullExtentJson = getFullExtFromExtentSets(config.map.extentSets);
                geoState.mapExtent = gapiService.gapi.mapManager.getExtentFromJson(fullExtentJson);

                geoState.lods = getLod(config.map.lods);

            }

            /**
            * Ready a trigger on the map load event.
            * Also initialize map full extent.
            * @function prepMapLoad
            * @private
            */
            function prepMapLoad() {
                // we are returning a promise that resolves when the map load happens.

                return $q(resolve => {
                    const map = service.mapObject;
                    const lFullExtent = getFullExtFromExtentSets(config.map.extentSets);

                    setMapLoadingFlag(true);

                    // map extent is not available until map is loaded
                    if (lFullExtent) {
                        gapiService.gapi.events.wrapEvents(map, {
                            load: () => {
                                // setup hilight layer
                                geoState.hilight = gapiService.gapi.hilight.makeHilightLayer();
                                map.addLayer(geoState.hilight);

                                // setup full extent
                                if (lFullExtent) {
                                    // compare map extent and setting.extent spatial-references
                                    // make sure the full extent has the same spatial reference as the map
                                    if (gapiService.gapi.proj.isSpatialRefEqual(map.extent
                                            .spatialReference,
                                            lFullExtent.spatialReference)) {

                                        // same spatial reference, no reprojection required
                                        geoState.fullExtent = gapiService.gapi.mapManager.getExtentFromJson(
                                            lFullExtent);
                                    } else {

                                        // need to re-project
                                        geoState.fullExtent = gapiService.gapi.proj.projectEsriExtent(
                                            gapiService.gapi.mapManager.getExtentFromJson(
                                                lFullExtent),
                                            map.extent.spatialReference);
                                    }
                                }

                                setMapLoadingFlag(false);
                                resolve();
                            },
                            'update-start': () => {
                                console.log('   Map update START!');

                                setMapLoadingFlag(true, 300);
                            },
                            'update-end': () => {
                                console.log('   Map update END!');

                                setMapLoadingFlag(false, 100);
                            }
                        });
                    }
                });
            }

            /**
             * Get basemap config from basemap id.
             * @function getBaseMapConfig
             * @private
             * @param {String} id base Map id
             * @return {Object} base map json object
             */
            function getBaseMapConfig(id) {
                return config.baseMaps.find(basemapConfig => (basemapConfig.id === id));
            }

            /**
             * Sets `isMapLoading` flag indicating map layers are updating.
             * @function setMapLoadingFlag
             * @param {Boolean} isLoading defaults to true; flag indicating if one or more layers begins updating their content
             * @param {Number}  delay     defaults to 0; delay before setting `isMapLoading` state; useful to avoid setting indicator for a small amounts of time
             * @private
             */
            function setMapLoadingFlag(isLoading = true, delay = 0) {
                // need to wrap this in a timeout since these are esri events, Angular wouldn't pick up on any changes unless a new digest cycle is triggered
                $timeout.cancel(service.loadingTimeout);
                service.loadingTimeout = $timeout(() => service.mapObject.isMapLoading = isLoading, delay);
            }

            /**
             * Hide base map.
             * @function hideBaseMap
             * @param {Boolean} hide flag indicates if basemap should be visible
             */
            function hideBaseMap(hide) {

                // TODO: move geoState stuff outside of the hidebasemap
                const mapManager = service.mapManager;
                const basemap = mapManager.BasemapControl.basemapGallery.get(geoState.blankBaseMapId);

                const basemapLayers = basemap.getLayers();

                // let visibleLayerIds = [];
                // visibleLayerIds.push(-1);
                // basemapLayers.setVisibleLayers(visibleLayerIds);

                // hide basemap by change visibility
                for (let basemapLayer of basemapLayers) {
                    basemapLayer.opacity = (hide === true) ? 0.0 : 1.0;
                }

                if (!hide) {
                    geoState.blankBaseMapId = null;
                }

            }

            // FIXME add doc
            function validateProj(sr) {
                return gapiService.gapi.proj.checkProj(sr).foundProj;
            }

        }
    }
})();
