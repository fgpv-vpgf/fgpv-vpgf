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

    function mapServiceFactory($q, $timeout, gapiService, storageService, $rootElement, $compile, $rootScope,
        tooltipService) {
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

            const blankBaseMapIdPattern = 'blank_basemap_';

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
                validateExtent,
                retrieveSymbol,
                hilightGraphic,
                clearHilight,
                dropMapPin,
                geolocate,
                getFullExtent
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
                setSelectedBaseMap(config.map.initialBasemapId || config.baseMaps[0].id, config);

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
                    scalebar: { enabled: false },
                    overviewMap: { enabled: false }
                };

                if (config.baseMaps) {
                    mapSettings.basemaps = config.baseMaps;
                }

                // TODO: components should be mandatory in the schema with value enabled false if not use
                if (config.map.components.scaleBar && config.map.components.scaleBar.enabled) {
                    mapSettings.scalebar = {
                        enabled: true,
                        attachTo: 'bottom-left',
                        scalebarUnit: 'dual'
                    };
                }

                // TODO: components should be mandatory in the schema with value enabled false if not use
                if (config.map.components.overviewMap && config.map.components.overviewMap.enabled) {

                    // FIXME: overviewMap has more settings
                    mapSettings.overviewMap = config.map.components.overviewMap;
                }

                const onMapLoad = prepMapLoad();

                service.mapManager = gapiService.gapi.mapManager.setupMap(mapObject, mapSettings);
                service.mapManager.BasemapControl.setBasemap(geoState.selectedBaseMapId);

                service.mapManager.BasemapControl.basemapGallery.on('selection-change', event => {
                    $rootElement.find('div.ovwContainer').append('<rv-overview-toggle></rv-overview-toggle>');
                    $compile($rootElement.find('rv-overview-toggle')[0])($rootScope);

                    // get selected basemap configuration
                    const selectedBaseMapCfg = config.baseMaps.find(bm => {
                        return bm.id === event.target._selectedBasemap.id;
                    });

                    // hide attribution and set logo not visible between basemap change selection to avoid stuff moving
                    // when we change language
                    const attNode = $(service.mapObject.attribution.listNode.parentNode);
                    const logoNode = attNode.parent().find('.logo-med');
                    attNode.hide();
                    logoNode.css('visibility', 'hidden');

                    // set attribution if not a blank map
                    if (geoState.blankBaseMapId === null) {
                        $timeout(() => setAttribution(selectedBaseMapCfg), 500);
                    }
                });

                if (config.map.initialBasemapId && config.map.initialBasemapId.startsWith(blankBaseMapIdPattern)) {
                    hideBaseMap(true);
                }

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
             * Retrieve maximum extent from extentSets.
             * @function getMaxExtFromExtentSets
             * @param {Object} extentSets collection of extents from the app config
             * @returns {Object|Null} the maximum extent as defined by the config. null if nothing is defined.
             * @private
             */
            function getMaxExtFromExtentSets(extentSets) {

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

                    // find the maximum extent type from extentSetForId
                    return extentSetForId.maximum || extentSetForId.full || extentSetForId.default || null;
                } else {
                    return null;
                }
            }

            /**
             * Retrieve default extent from extentSets.
             * @function getDefaultExtFromExtentSets
             * @private
             */
            function getDefaultExtFromExtentSets(extentSets) {
                // TODO: Need to handle cases where an extentset not defined
                return extentSets.find(extentSet => extentSet.id === geoState.selectedBaseMapExtentSetId)
                    .default;
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
             * @param {object} selectedBaseMap selected basemap
             */
            function selectBasemap(selectedBaseMap) {
                const mapManager = service.mapManager;
                let id = selectedBaseMap.id;

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
             * Set attribution on selected base map.
             * @function setAttribution
             * @param {Object} config base map configuration
             */
            function setAttribution(config) {
                const cfgAtt = config.attribution;
                const attNode = $(service.mapObject.attribution.listNode.parentNode);
                const logoNode = attNode.parent().find('.logo-med');

                // esri default logo
                // jscs:disable maximumLineLength
                const esriLogo = 'url(data:image/png;base64,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)';
                // jscs:enable maximumLineLength

                // if config is undefined, show attribution text and use built in value
                // if it is !== then undefined take values from config file
                // for not esri basemap, logo should be disable if no custom logo are provided
                // because esri logo and liks are the default values
                if (typeof cfgAtt !== 'undefined') {
                    if (cfgAtt.text.enabled && cfgAtt.text.value) {
                        // loop through node keys to replace value with content from configuration file
                        // TODO: test when will we have a base map with multiple layers
                        for (let [key] of Object.entries(service.mapObject.attribution.itemNodes)) {
                            service.mapObject.attribution.itemNodes[key].innerText = cfgAtt.text.value;
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
                            gapiService.gapi.mapManager.mapDefault('logoLink', cfgAtt.logo.link);
                        } else {
                            logoNode.css('background-image', esriLogo);
                            gapiService.gapi.mapManager.mapDefault('logoLink', 'http://www.esri.com'); // TODO: create a function in geoapi to get default config value
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
                        const zoomValue = service.mapObject.getZoom() + settings.zoomCounter;
                        const zoomPromise = service.mapObject.setZoom(zoomValue);
                        settings.zoomCounter = 0;
                        // undefined signals we've zoomed in/out as far as we can
                        if (typeof zoomPromise !== 'undefined') {
                            settings.zoomPromise = zoomPromise;
                        }
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
             * Get the maps full extent.
             * @function getFullExtent
             */
            function getFullExtent() {
                return geoState.fullExtent;
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
             * @param  {Object} layer is the esri layer object of the graphic that will be zoomed to
             * @param {Object} zoomLayer zoom object in format used by layerRegistry's zoomToScale
             * @param  {Integer} featureIdx the index of the layer (relevant for dynamic sub-layers)
             * @param  {Integer} objId is ID of object to be zoomed to
             */
            function zoomToGraphic(layer, zoomLayer, featureIdx, objId) {
                fetchGraphic(layer, featureIdx, objId).then(gBundle => {
                    zoomWithOffset(gBundle.graphic.geometry, layer, zoomLayer).then(() => {
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
                    tooltipService.removeHoverTooltip();
                });
            }

            /**
             * Given a geometry, attributes, spatialReference and zoomlevel, reprojects geometry from its spatialReference
             * to the map's spatialReference, then zooms to the maximum level such that the geometry is still visible.
             *
             * @function zoomWithOffset
             * @param  {Object} geo is the geometry to be zoomed to
             * @param  {Object} layer is the esri layer object of the graphic that will be zoomed to
             * @param {Object} zoomLayer zoom object in format used by layerRegistry's zoomToScale
             * @returns {Promise} resolves when zoom finishes
             */
            function zoomWithOffset(geo, layer, zoomLayer) {
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
                    const zoomed = geoState.layerRegistry.zoomToScale(
                        zoomLayer, zoomLayer.options.offscale.value, true);
                    return zoomed.then(() => {
                        const xOffset = (map.extent.xmax - map.extent.xmin) * ratio * (-1);
                        const newPt = pt.offset(xOffset, (map.extent.ymax - map.extent.ymin) / 4);
                        return map.centerAt(newPt);
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
                    [parseFloat(location.longitude), parseFloat(location.latitude)]);
                const zoomPt = gapiService.gapi.proj.Point(geoPt[0], geoPt[1], map.spatialReference);

                // give preference to the layer closest to a 50k scale ratio which is ideal for zoom
                const sweetLod = gapiService.gapi.mapManager.findClosestLOD(map.__tileInfo.lods, 50000);
                map.centerAndZoom(zoomPt, Math.max(sweetLod.level, 0));
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
            * @return {Object} selectedBaseMap selected basemap configuration
            */
            function setSelectedBaseMap(id) {
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
                    geoState.selectedBaseMapId = selectedBaseMap.id;
                }

                // get selected base map extent set id, so we can store teh map extent
                geoState.selectedBaseMapExtentSetId = selectedBaseMap.extentId;
                geoState.selectedBaseMapLodId = selectedBaseMap.lodId;

                const defaultExtentJson = getDefaultExtFromExtentSets(config.map.extentSets);
                geoState.mapExtent = gapiService.gapi.mapManager.getExtentFromJson(defaultExtentJson);

                geoState.lods = getLod(config.map.lods);

                return selectedBaseMap;
            }

            /**
            * Takes a config based extent and returns a proper extent. Casts to Extent class.
            * Reprojects to map projection if required.
            *
            * @function enhanceConfigExtent
            * @private
            * @param {Object} extent   the extent to enhance
            * @param {Object} mapSR    the spatial reference of the map
            * @returns {Object}        extent cast in Extent prototype, and in map spatial reference
            */
            function enhanceConfigExtent(extent, mapSR) {
                const realExtent = gapiService.gapi.mapManager.getExtentFromJson(extent);

                if (gapiService.gapi.proj.isSpatialRefEqual(mapSR, extent.spatialReference)) {
                    // same spatial reference, no reprojection required
                    return realExtent;
                } else {
                    // need to re-project
                    return gapiService.gapi.proj.projectEsriExtent(realExtent, mapSR);
                }
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
                    const lMaxExtent = getMaxExtFromExtentSets(config.map.extentSets);

                    setMapLoadingFlag(true);

                    gapiService.gapi.events.wrapEvents(map, {
                        load: () => {
                            // setup hilight layer
                            geoState.hilight = gapiService.gapi.hilight.makeHilightLayer();
                            map.addLayer(geoState.hilight);

                            // setup full extent
                            if (lFullExtent) {
                                geoState.fullExtent = enhanceConfigExtent(lFullExtent, map.extent.spatialReference);
                            }
                            if (lMaxExtent) {
                                geoState.maxExtent = enhanceConfigExtent(lMaxExtent, map.extent.spatialReference);
                            }

                            setMapLoadingFlag(false);
                            resolve();
                        },
                        'update-start': () => {
                            console.log('   Map update START!');

                            setMapLoadingFlag(true, 300);
                        },
                        'extent-change': data => $rootScope.$broadcast('extentChange', data),
                        'update-end': () => {
                            console.log('   Map update END!');

                            setMapLoadingFlag(false, 100);
                        }
                    });

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
                Object.entries(basemapLayers).forEach(([index, basemapLayer]) => {
                    basemapLayer.opacity = (hide === true) ? 0.0 : 1.0;
                });

                if (!hide) {
                    geoState.blankBaseMapId = null;
                }

            }

            // FIXME add doc
            function validateProj(sr) {
                return gapiService.gapi.proj.checkProj(sr).foundProj;
            }

            /**
             * Check if visible extent is contain in full extent
             *
             * @function validateExtent
             * @param {Number} factor optional; factor to expand the full extent
             * @return   {Boolean}   True if the visible extent is contain in full extent - false if not contain
             */
            function validateExtent(factor = 1) {
                return getFullExtent().expand(factor).contains(service.mapObject.extent);
            }
        }
    }
})();
