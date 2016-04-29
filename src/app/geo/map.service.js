(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name mapService
     * @module app.geo
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
        return mapService;

        function mapService(geoState, config) {

            const initProps = ['fullExtent', 'mapExtent', 'lods', 'selectedBaseMapId',
                'selectedBaseMapExtentSetId', 'selectedBaseMapLodId', 'blankBaseMapId'];

            initProps.forEach(prop => {
                if (angular.isUndefined(geoState[prop])) {
                    geoState[prop] = null;
                }
            });

            // this `service` object will be exposed through `geoService`
            const service = {
                mapObject: null,
                mapManager: null, // Object

                baseMapHasSameSP,
                setZoom,
                shiftZoom,
                selectBasemap,
                setFullExtent,
                setSelectedBaseMap,
                zoomToGraphic,
            };

            return buildMapObject();

            /***/

            /**
             * Builds an actual esri map object
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
                    setSelectedBaseMap(config.baseMaps[0].id, config);
                }

                // FIXME remove the hardcoded settings when we have code which does this properly
                mapObject = gapiService.gapi.mapManager.Map(geoState.mapNode, {

                    // basemap: 'gray',
                    extent: geoState.mapExtent,
                    lods: geoState.lods
                });

                // console.log('I AM MAP EXTENT', geoState.mapExtent);
                // console.log('I AM THE MAP', mapObject);

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

            /*
             * Retrieve full extent from extentSets
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

            /*
             * Retrieve level of details array from config for current basemap
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

            /*
            * Check to see if given base map id has same wkid value as previously selected base map
            * @param {id} base map id
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
             * Sets zoom level of the map to the specified level
             * @param {number} value a zoom level number
             */
            function setZoom(value) {
                service.mapObject.setZoom(value);
            }

            /**
             * Changes the zoom level by the specified value relative to the current level; can be negative
             * @param  {number} byValue a number of zoom levels to shift by
             */
            function shiftZoom(byValue) {
                const map = service.mapObject;
                let newValue = map.getZoom() + byValue;
                map.setZoom(newValue);
            }

            /**
             * Set the map to full extent
             */
            function setFullExtent() {
                const map = service.mapObject;
                if (geoState.fullExtent) {
                    map.setExtent(geoState.fullExtent);
                } else {
                    console.warn('GeoService: fullExtent value is not set.');
                }
            }

            // only handles feature layers right now. zoom to dynamic/wms layers obj won't work
            /**
             * Fetches a point in a layer given the layerUrl and objId of the object and then zooms to it
             * @param  {layer} layer is the layer object of graphic to zoom
             * @param  {objId} objId is ID of object that was clicked on datatable to be zoomed to
             */
            function zoomToGraphic(layer, objId) {
                const map = service.mapObject;

                // layerUrl is the URL that the point to be zoomed to belongs to
                let layerUrl = `${layer.url}/`;
                if (layer.layerInfos) {
                    layerUrl += `${featureIndex}/`;
                }

                // FIXME: support file based layers with no url
                const geo = gapiService.gapi.layer.getFeatureInfo(layerUrl, objId);
                console.log('enhance ', layer, objId);
                geo.then(geoInfo => {
                    if (geoInfo) {
                        const barWidth = storageService.panels.sidePanel.outerWidth();
                        const mapWidth = storageService.panels.map.outerWidth();

                        // barWidth/mapWidth is the % of map blocked by side panel
                        // shifting by 1/2 % of blocked map offsets point to center of visible map
                        // this ratio always changes based on window resizing/map resizing
                        // since the side panel is always 400px; need ratio every time zoom happens
                        const ratio = (barWidth / mapWidth) / 2;

                        // make new graphic with proper spatialReference
                        geoInfo.feature.geometry.spatialReference = layer.spatialReference;
                        const newg = gapiService.gapi.proj.Graphic({
                            geometry: geoInfo.feature.geometry,
                            attributes: geoInfo.feature.attributes
                        });

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
                            map.setExtent(gExt);
                        } else {
                            // handles points
                            const pt = newExt.getCenter();
                            const zoomed = map.setZoom(8);
                            zoomed.then(() => {
                                const xOffset = (map.extent.xmax - map.extent.xmin) * ratio * (-1);
                                const newPt = pt.offset(xOffset, (map.extent.ymax - map.extent.ymin) / 4);
                                map.centerAt(newPt, 8);
                            });
                        }
                    }
                });
            }

            /*
            * Sets the current selected map id and extent set id, creates the fullExtent
            * @param {id} base map id
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

            /*
            * Ready a trigger on the map load event
            * Also initialize map full extent
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

            /*
             * Get basemap config from basemap id
             * @private
             * @param id base Map id
             * @param config config object
             * @return {object} base map json object
             */
            function getBaseMapConfig(id) {
                return config.baseMaps.find(basemapConfig => (basemapConfig.id === id));
            }

            /**
             * Sets `isMapLoading` flag indicating map layers are updating.
             * @param {Boolean} isLoading defaults to true; flag indicating if one or more layers begins updating their content
             * @param {Number}  delay     defaults to 0; delay before setting `isMapLoading` state; useful to avoid setting indicator for a small amounts of time
             * @private
             */
            function setMapLoadingFlag(isLoading = true, delay = 0) {
                // need to wrap this in a timeout since these are esri events, Angular wouldn't pick up on any changes unless a new digest cycle is triggered
                $timeout.cancel(service.loadingTimeout);
                service.loadingTimeout = $timeout(() => service.mapObject.isMapLoading = isLoading, delay);
            }

            /*
             * Hide base map
             * @param hide flag indicates if basemap should be visible
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

        }
    }
})();
